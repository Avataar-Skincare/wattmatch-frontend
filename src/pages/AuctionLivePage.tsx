import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { useAuth } from '../lib/authContext';

// Real auction join tool — other bidders are actual other people in their own tabs, not client-side
// simulation. Two ways to arrive here:
//  - New mode (?auctionId=N): the production path. The join link is a generic pointer, not a bearer
//    credential — requires the visitor's real org login, then POST /api/auctions/:id/join mints a
//    short-lived socket token scoped to their pre-assigned seat. See routes/auctions.ts.
//  - Legacy mode (?token=...): auctionAdmin.ts's manual /auctions/seed demo tool, which has no real
//    Organization to log in as — the emailed link embeds the bearer token directly, exactly as
//    before. Both modes end up handing the socket the same token shape, so everything past the
//    join step (auctionSocket.ts, the UI below) is identical either way.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

// Matches the countdown ring already used by the /auction demo page — same radius/circumference,
// same CSS classes, so this reuses styling that already exists rather than inventing new rules.
const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'error' | 'not-invited' | 'not-found' | 'session-expired';
type ParticipantRole = 'generator' | 'buyer';

// Legacy-mode only — reads the auctionId claim out of the join token's payload segment, just enough
// to know which auction to ask /winner-identity about. New mode never needs this: the auctionId is
// already known directly from the URL. Not a verification either way — the server re-verifies the
// token's signature on every real request.
function decodeAuctionIdFromToken(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    // JWT segments are base64url with no padding — atob() is inconsistent about tolerating that
    // across browsers (notably stricter on mobile Safari), so pad back to a multiple of 4 before
    // decoding rather than relying on every environment accepting an unpadded string.
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const auctionId = JSON.parse(json)?.auctionId;
    return typeof auctionId === 'number' ? auctionId : null;
  } catch {
    return null;
  }
}

interface AuctionState {
  status: 'scheduled' | 'live' | 'closed';
  currentBid: number;
  windowEndsAt: number | null;
  windowMs: number;
  extensionCount: number;
  maxExtensions: number;
  minUndercut: number;
  leaderAlias: string | null;
  // Landed-rate formula inputs (see auctionEngine.ts's computeLandedRate on the server) — constant
  // for the auction, forwarded as-is so a bidder's own landed-rate preview below matches what the
  // server will actually compute. Only meaningful when useLandedRate is true below.
  equityValue: number;
  totalUnitsPerYear: number;
  // Per-auction switch, decided at tender creation (see Tender.useLandedRate on the server) — a
  // normal-rate auction shows the original single-rate bid form and never runs the formula at all.
  useLandedRate: boolean;
}

function computeLandedRate(rate: number, returnPercent: number, equityValue: number, totalUnitsPerYear: number): number {
  return rate - ((returnPercent / 100) * equityValue) / totalUnitsPerYear;
}

interface JoinError extends Error {
  status: number;
}

async function joinAuction(auctionId: number, orgToken: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auctions/${auctionId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${orgToken}` },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    const err = new Error(data.error || 'Failed to join auction') as JoinError;
    err.status = res.status;
    throw err;
  }
  return data.token as string;
}

export default function AuctionLivePage() {
  const { auth, hydrated } = useAuth();
  const navigate = useNavigate();

  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [myAlias, setMyAlias] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<ParticipantRole | null>(null);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [state, setState] = useState<AuctionState | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  // Brief visual flash on a new lowest bid — same purpose as the /auction demo's flashId, just
  // simpler (a boolean, not per-bidder), since only the current leading bid is shown, not a
  // per-bidder history feed.
  const [priceFlash, setPriceFlash] = useState(false);
  const [rateInput, setRateInput] = useState('');
  const [returnInput, setReturnInput] = useState('');
  const [bidError, setBidError] = useState<string | null>(null);
  const [winner, setWinner] = useState<{ alias: string | null; amount: number; disclosure: string } | null>(null);
  // Real identity (organizationName), not just alias — populated only if the /winner-identity
  // reveal succeeds, which the backend restricts to the winning generator and the buyer only (see
  // routes/auctions.ts). Every other role gets a 403 there, so this simply stays null for them — not
  // an error state, just nothing to show.
  const [revealedCounterparty, setRevealedCounterparty] = useState<{ alias: string; organizationName: string } | null>(null);
  const [sessionReplaced, setSessionReplaced] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  // The credential actually presented to the socket: the URL's bearer token in legacy mode, or a
  // freshly /join-minted one in new mode — refreshed on every reconnect attempt via the socket's
  // async `auth` callback below, not just set once at connect time.
  const tokenRef = useRef<string | null>(null);
  const auctionIdRef = useRef<number | null>(null);
  const isFirstAttemptRef = useRef(true);
  // Socket event handlers below are wired up once (empty-deps effect), so they'd otherwise close
  // over the initial null `state` forever — this ref gives them a live read of the latest value.
  const stateRef = useRef<AuctionState | null>(null);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Parsed once, client-side only, into state rather than read directly in the render body — this
  // page is pre-rendered at build time via vite-react-ssg, which runs component code in Node with no
  // `window` at all. Every effect below gates on `urlParams !== null` the same way they already have
  // to gate on `hydrated` (authContext's own client-only localStorage read), so nothing here ever
  // touches `window` outside a browser.
  const [urlParams, setUrlParams] = useState<{ token: string | null; auctionId: number | null } | null>(null);
  useEffect(() => {
    const parsed = new URLSearchParams(window.location.search);
    const auctionIdParam = parsed.get('auctionId');
    setUrlParams({ token: parsed.get('token'), auctionId: auctionIdParam ? Number(auctionIdParam) : null });
  }, []);
  const legacyToken = urlParams?.token ?? null;
  const newModeAuctionId = urlParams?.auctionId ?? null;

  // Shared by both modes — attaches every socket event handler once a Socket instance exists.
  // Defined once per render, called from whichever effect below actually creates the socket, so the
  // ~15 event bindings aren't duplicated between the legacy and new-mode connection paths.
  function wireSocket(socket: Socket) {
    socket.on('connect', () => setConnection('connected'));
    socket.on('connect_error', (err) => {
      setConnection((prev) => (prev === 'session-expired' ? prev : 'error'));
      setConnectionError(err.message || 'Could not connect.');
    });
    socket.on('you:info', (payload: { alias: string; role: ParticipantRole; rulesAccepted: boolean }) => {
      setMyAlias(payload.alias);
      setMyRole(payload.role);
      setRulesAccepted(payload.rulesAccepted);
    });
    socket.on('rules:accepted', () => setRulesAccepted(true));
    socket.on('state:sync', (payload: AuctionState | null) => setState(payload));
    // The server emits this when a Redis/DB blip happens during its own post-connect setup — the
    // one case where state:sync/you:info never arrive at all. Without this, the client's 'connect'
    // event (which fires before that async setup completes) has already flipped connection to
    // 'connected' by the time this would show up, leaving the room screen rendering nothing with no
    // indication anything went wrong and no recovery short of a manual reload.
    socket.on('session:error', (payload: { message: string }) => {
      setConnection((prev) => (prev === 'session-expired' ? prev : 'error'));
      setConnectionError(payload.message || 'Something went wrong loading this auction — please refresh.');
    });
    socket.on(
      'state:update',
      (payload: { currentBid: number; windowEndsAt: number; alias: string }) => {
        setState((prev) => (prev ? { ...prev, currentBid: payload.currentBid, windowEndsAt: payload.windowEndsAt, leaderAlias: payload.alias } : prev));
        setPriceFlash(true);
        setTimeout(() => setPriceFlash(false), 700);
      }
    );
    socket.on('bid:rejected', (payload: { reason: string; currentBid?: number }) => {
      const minUndercut = stateRef.current?.minUndercut ?? 0.01;
      setBidError(
        payload.reason === 'NOT_LOW_ENOUGH'
          ? `Must be at least ₹${minUndercut.toFixed(2)} below the current lowest bid${payload.currentBid ? ` of ₹${payload.currentBid.toFixed(2)}` : ''}.`
          : payload.reason === 'AUCTION_NOT_LIVE'
          ? 'This auction is no longer live.'
          : payload.reason === 'RULES_NOT_ACCEPTED'
          ? 'Accept the auction rules before bidding.'
          : payload.reason === 'INVALID_RETURN_PERCENT'
          ? 'Returns must be a percentage between 0 and 100.'
          : payload.reason === 'INTERNAL_ERROR'
          ? 'Something went wrong processing that bid — try again.'
          : payload.reason === 'RATE_LIMITED'
          ? 'Slow down — you\'re bidding too fast.'
          : payload.reason === 'NOT_A_BIDDER'
          ? 'You\'re watching this auction as the buyer — only generators can bid.'
          : 'Bid rejected — enter a valid amount.'
      );
    });
    socket.on(
      'auction:closed',
      (payload: {
        winnerAlias: string | null;
        winningBid: number;
        resultType: string;
        disclosure: string;
        useLandedRate: boolean;
        extensionCount: number;
        maxExtensions: number;
        minUndercut: number;
      }) => {
        // `prev` can legitimately still be null here: state:sync arrives null when the server's
        // Redis auction state is gone (now that closed auctions carry a 24h TTL — see the server's
        // markAuctionClosed), which happens for anyone who joins after that TTL has expired. The
        // server still sends a correct auction:closed from its own DB fallback in that case, so
        // this must be able to establish the closed view from scratch, not just patch an existing
        // one — silently dropping the update (as the old `prev ? {...} : prev` did) left a late
        // joiner on a blank page with no way to ever see the result.
        //
        // useLandedRate/extensionCount/maxExtensions/minUndercut now come from the payload itself
        // (the server always has them — see auctionSocket.ts) rather than being hardcoded to
        // 0/false: this auction-room view renders "Current lowest bid" vs "landed rate" and
        // "Extensions used: X / Y" unconditionally, even for a closed auction, so a late joiner used
        // to see fabricated zeros presented as if they were real history.
        setState((prev) =>
          prev
            ? {
                ...prev,
                status: 'closed',
                currentBid: payload.winningBid,
                leaderAlias: payload.winnerAlias,
                useLandedRate: payload.useLandedRate,
                extensionCount: payload.extensionCount,
                maxExtensions: payload.maxExtensions,
                minUndercut: payload.minUndercut,
              }
            : {
                status: 'closed',
                currentBid: payload.winningBid,
                windowEndsAt: null,
                windowMs: 0,
                extensionCount: payload.extensionCount,
                maxExtensions: payload.maxExtensions,
                minUndercut: payload.minUndercut,
                leaderAlias: payload.winnerAlias,
                equityValue: 0,
                totalUnitsPerYear: 0,
                useLandedRate: payload.useLandedRate,
              }
        );
        setWinner({ alias: payload.winnerAlias, amount: payload.winningBid, disclosure: payload.disclosure });
      }
    );
    // Same join link/token opened somewhere else (another tab, another device) — the server has
    // already handed that new connection the "you are X" seat and is about to cut this one off.
    // Stop here rather than let the client's own reconnect logic fight over the same identity.
    socket.on('session:replaced', () => {
      setSessionReplaced(true);
      socket.disconnect();
    });
    // A dropped connection (transport lost, ping timeout, server restart) previously left the room
    // UI — countdown still ticking locally, bid form still enabled — looking exactly like a live
    // connection, while socket.io's automatic reconnect ran silently in the background and any
    // `emit('bid:new', ...)` attempt in the meantime went nowhere with no error. Hiding the room and
    // showing this instead makes that state visible; the 'connect' handler above already flips back
    // to 'connected' (and the server re-sends state:sync) the moment reconnection succeeds. The one
    // disconnect reason to ignore is 'io client disconnect' — that's always a disconnect THIS code
    // itself already triggered on purpose (session:replaced above, or unmount cleanup), which has
    // its own, more specific handling already.
    socket.on('disconnect', (reason) => {
      if (reason === 'io client disconnect') return;
      setConnection((prev) => (prev === 'session-expired' || prev === 'error' ? prev : 'reconnecting'));
    });
  }

  // Legacy mode: exactly today's behavior — a bearer token embedded in the URL is the whole
  // credential, connect immediately, no login involved.
  useEffect(() => {
    if (!legacyToken) return;
    tokenRef.current = legacyToken;

    // Default Socket.io path — kept separate from /api/*; needs its own CloudFront routing rule
    // in production rather than piggybacking on the REST API. See AUCTION_PLAN.md.
    const socket = io(API_BASE, { auth: { token: legacyToken } });
    socketRef.current = socket;
    wireSocket(socket);

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legacyToken]);

  // New mode: requires a real org login, then POST /join to mint the socket credential. Waits for
  // `hydrated` (the client-only localStorage read — see authContext.tsx) before deciding whether the
  // visitor is logged in, so SSG's server-rendered pass never flashes a false "not logged in" state.
  useEffect(() => {
    if (legacyToken || !newModeAuctionId || !Number.isFinite(newModeAuctionId)) return;
    if (!hydrated) return;

    auctionIdRef.current = newModeAuctionId;

    if (!auth) {
      navigate(`/login?next=${encodeURIComponent(`/auction-live?auctionId=${newModeAuctionId}`)}`, { replace: true });
      return;
    }

    let cancelled = false;
    let socket: Socket | null = null;

    (async () => {
      try {
        const token = await joinAuction(newModeAuctionId, auth.token);
        if (cancelled) return;
        tokenRef.current = token;
        isFirstAttemptRef.current = true;

        socket = io(API_BASE, {
          // A function, not a plain object — socket.io calls this fresh on every connection AND
          // every automatic reconnect attempt, and waits for the callback before proceeding. The
          // very first attempt reuses the token just minted above; every attempt after that
          // (a dropped connection resuming, possibly hours or days later) re-runs the full /join
          // handshake against the current org session, so a stale/expired socket token never
          // strands an otherwise-still-invited participant.
          auth: (cb) => {
            if (isFirstAttemptRef.current) {
              isFirstAttemptRef.current = false;
              cb({ token: tokenRef.current });
              return;
            }
            joinAuction(newModeAuctionId, auth.token)
              .then((fresh) => {
                tokenRef.current = fresh;
                cb({ token: fresh });
              })
              .catch((err: JoinError) => {
                // Mirrors the initial-join catch below — previously only a 401 got a specific
                // message here; any other reconnect failure (403 invite revoked, 404 auction gone,
                // a network error) just called cb({}) with nothing else, so the only thing the user
                // ever saw was socket.io's own generic "connect_error" text, not the actual reason.
                // 401/403/404 are all terminal — retrying won't fix a revoked invite or a gone
                // auction, so the socket is closed rather than left to keep silently retrying. A
                // plain network error (no status at all) is left alone: socket.io's own automatic
                // reconnect will call this same callback again, and a transient blip may well
                // recover on its own — this just makes sure the interim state is visible too.
                if (err.status === 401) {
                  setConnection('session-expired');
                  socket?.close();
                } else if (err.status === 403) {
                  setConnection('not-invited');
                  socket?.close();
                } else if (err.status === 404) {
                  setConnection('not-found');
                  socket?.close();
                } else {
                  setConnection((prev) => (prev === 'session-expired' || prev === 'error' ? prev : 'reconnecting'));
                }
                cb({});
              });
          },
        });
        socketRef.current = socket;
        wireSocket(socket);
      } catch (err) {
        if (cancelled) return;
        const status = (err as JoinError).status;
        setConnection(status === 403 ? 'not-invited' : status === 404 ? 'not-found' : status === 401 ? 'session-expired' : 'error');
        if (status !== 403 && status !== 404 && status !== 401) {
          setConnectionError(err instanceof Error ? err.message : 'Failed to join auction.');
        }
      }
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legacyToken, newModeAuctionId, hydrated, auth?.token]);

  useEffect(() => {
    if (!urlParams || legacyToken || newModeAuctionId) return;
    setConnection('error');
    setConnectionError('No auction link — use the link generated for you.');
  }, [urlParams, legacyToken, newModeAuctionId]);

  // Countdown ticks locally between server updates, but windowEndsAt itself only ever comes
  // from the server — this just renders it, never decides it.
  useEffect(() => {
    if (!state?.windowEndsAt) {
      setSecondsLeft(null);
      return;
    }
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((state.windowEndsAt! - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [state?.windowEndsAt]);

  // Fires once the auction closes — asks the backend to reveal the counterparty's real identity.
  // Harmless to call regardless of role: the endpoint itself restricts this to the winning
  // generator and the buyer (routes/auctions.ts), so a losing generator's request just comes back
  // 403 and revealedCounterparty simply stays null — no separate role check needed here. Uses the
  // org login in new mode (the durable credential — this can fire long after any socket token has
  // expired) or the legacy URL token in legacy mode, against the same endpoint either way.
  useEffect(() => {
    if (!winner) return;
    const auctionId = legacyToken ? decodeAuctionIdFromToken(legacyToken) : auctionIdRef.current;
    const credential = legacyToken ?? auth?.token;
    if (!credential || auctionId === null) return;

    let cancelled = false;
    fetch(`${API_BASE}/api/auctions/${auctionId}/winner-identity`, {
      headers: { Authorization: `Bearer ${credential}` },
    })
      .then((res) => res.json())
      .then((result) => {
        if (!cancelled && result.success) {
          setRevealedCounterparty({ alias: result.alias, organizationName: result.organizationName });
        }
      })
      .catch(() => {
        // Not part of the winning pair, network hiccup, etc. — nothing to show, not an error the
        // user needs to see; the rest of the closed-auction UI (alias, winning bid) already works.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner]);

  function submitBid(e: React.FormEvent) {
    e.preventDefault();
    setBidError(null);
    const rate = Number(rateInput);
    if (!rateInput.trim() || Number.isNaN(rate) || rate <= 0) {
      setBidError('Enter a valid rate.');
      return;
    }
    // A normal-rate auction never shows the returns input at all (see the form below) — always
    // send 0 for it, matching what the server ignores anyway for a non-landed-rate auction.
    let returnPercent = 0;
    if (state?.useLandedRate) {
      returnPercent = Number(returnInput);
      if (!returnInput.trim() || Number.isNaN(returnPercent) || returnPercent < 0 || returnPercent > 100) {
        setBidError('Enter a returns percentage between 0 and 100.');
        return;
      }
    }
    socketRef.current?.emit('bid:new', { rate, returnPercent });
    setRateInput('');
    setReturnInput('');
  }

  // Client-side only — a live preview so a bidder sees what they're about to submit; the server
  // independently recomputes and is the sole authority on what actually gets compared.
  const previewRate = Number(rateInput);
  const previewReturn = Number(returnInput);
  const previewLandedRate =
    state?.useLandedRate && rateInput.trim() && returnInput.trim() && Number.isFinite(previewRate) && Number.isFinite(previewReturn)
      ? computeLandedRate(previewRate, previewReturn, state.equityValue, state.totalUnitsPerYear)
      : null;

  function acceptRules() {
    socketRef.current?.emit('rules:accept');
  }

  return (
    <div className="content-page">
      <Seo title="Live auction (internal test)" description="Internal reverse-auction PoC test tool." path="/auction-live" />
      <Header minimal />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Internal PoC</span>
            <h1>Reverse auction — live test</h1>
            <p>Real bidding against a real backend, with whoever else has a join link for this auction.</p>
          </div>
        </div>

        <section>
          <div className="wrap">
            {sessionReplaced ? (
              <p style={{ textAlign: 'center', color: '#B53A3A' }}>
                This join link was opened in another tab or device, so this one has been disconnected.
                Reopen your join link here if you want to bid from this tab instead.
              </p>
            ) : (
              <>
                {connection === 'connecting' && <p style={{ textAlign: 'center' }}>Connecting…</p>}
                {connection === 'reconnecting' && (
                  <p style={{ textAlign: 'center' }}>
                    Connection lost — reconnecting… any bid you submit right now won't go through until this
                    reconnects.
                  </p>
                )}
                {connection === 'not-invited' && (
                  <p style={{ textAlign: 'center', color: '#B53A3A' }}>You're not invited to this auction.</p>
                )}
                {connection === 'not-found' && (
                  <p style={{ textAlign: 'center', color: '#B53A3A' }}>Auction not found.</p>
                )}
                {connection === 'session-expired' && (
                  <p style={{ textAlign: 'center', color: '#B53A3A' }}>
                    Your session expired.{' '}
                    <a href={`/login?next=${encodeURIComponent(`/auction-live?auctionId=${auctionIdRef.current ?? ''}`)}`}>
                      Log back in
                    </a>{' '}
                    to rejoin.
                  </p>
                )}
                {connection === 'error' && (
                  <p style={{ textAlign: 'center', color: '#B53A3A' }}>{connectionError}</p>
                )}

                {connection === 'connected' && !state && (
                  <p style={{ textAlign: 'center' }}>
                    Loading auction — if this doesn't update in a moment, try refreshing.
                  </p>
                )}

                {connection === 'connected' && state && (
                  <div className="auction-room">
                    <div className="auction-room-head">
                      <span className={`auction-status${state.status === 'live' ? ' live' : ''}`}>
                        <span className="dot"></span>
                        {state.status === 'live' ? 'Live' : state.status === 'closed' ? 'Closed' : 'Scheduled'}
                        {myRole === 'buyer'
                          ? ' — you are watching as the buyer'
                          : myAlias
                          ? ` — you are ${myAlias}`
                          : ''}
                      </span>
                    </div>

                    <div className="auction-centerpiece auction-live-centerpiece">
                      {secondsLeft !== null && state.status === 'live' && (
                        <div className={`auction-ring-wrap${priceFlash ? ' flash' : ''}`}>
                          <svg viewBox="0 0 120 120">
                            <circle className="auction-ring-track" cx="60" cy="60" r={RING_RADIUS} />
                            <circle
                              className={`auction-ring-fill${priceFlash ? ' reset' : ''}`}
                              cx="60"
                              cy="60"
                              r={RING_RADIUS}
                              strokeDasharray={RING_CIRCUMFERENCE}
                              strokeDashoffset={
                                RING_CIRCUMFERENCE *
                                (1 - Math.min(1, Math.max(0, secondsLeft / (state.windowMs / 1000))))
                              }
                            />
                          </svg>
                          <div className="auction-ring-center">
                            <span className="t">{secondsLeft}</span>
                            <span className="l">sec left</span>
                          </div>
                        </div>
                      )}
                      <div className="auction-price">
                        <span className="ac-label">{state.useLandedRate ? 'Current lowest landed rate' : 'Current lowest bid'}</span>
                        <div className={`pv${priceFlash ? ' pulse' : ''}`}>
                          ₹{state.currentBid.toFixed(2)}<sup className="auction-live-price-sup">/unit</sup>
                        </div>
                        <div className="pd auction-live-price-pd">Held by {state.leaderAlias ?? 'nobody yet'}</div>
                      </div>
                      <p className="auction-human-hint">
                        Extensions used: {state.extensionCount} / {state.maxExtensions}
                      </p>
                    </div>

                    {myRole === 'buyer' && (
                      <p className="auction-human-hint" style={{ textAlign: 'center' }}>
                        You're watching this auction as the buyer — bidding is generator-only.
                      </p>
                    )}

                    {myRole === 'generator' && state.status === 'live' && !rulesAccepted && (
                      <div className="auction-human-controls">
                        <div className="auction-rules-box">
                          <span className="ac-label">Before you bid</span>
                          <ul>
                            {state.useLandedRate ? (
                              <>
                                <li>
                                  Current lowest landed rate is ₹{state.currentBid.toFixed(2)}/unit — landed rates only
                                  go down, and a valid bid must land at least ₹{state.minUndercut.toFixed(2)} below it.
                                </li>
                                <li>
                                  Your landed rate = rate − (returns% × equity value) / total units per year — enter
                                  both rate and returns, and you'll see your own landed rate before submitting.
                                </li>
                              </>
                            ) : (
                              <li>
                                Current lowest bid is ₹{state.currentBid.toFixed(2)}/unit — bids only go down, and a
                                valid bid must be at least ₹{state.minUndercut.toFixed(2)} below it.
                              </li>
                            )}
                            <li>
                              Any accepted bid resets the countdown to {Math.round(state.windowMs / 1000)}s for
                              everyone, up to {state.maxExtensions} times.
                            </li>
                            <li>This result is an indicative, non-binding match — the PPA is negotiated separately.</li>
                          </ul>
                          <button type="button" className="btn btn-solar" onClick={acceptRules}>
                            I accept these rules <span className="btn-arrow">→</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {myRole === 'generator' && state.status === 'live' && rulesAccepted && (
                      <div className="auction-human-controls">
                        <form className="auction-human-form" onSubmit={submitBid}>
                          <span className="auction-human-form-field auction-live-form-field">
                            <span className="auction-human-prefix">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              inputMode="decimal"
                              placeholder={state.useLandedRate ? 'rate' : `below ${state.currentBid.toFixed(2)}`}
                              aria-label="Rate"
                              value={rateInput}
                              onChange={(e) => setRateInput(e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          </span>
                          {state.useLandedRate && (
                            <span className="auction-human-form-field auction-live-form-field">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                inputMode="decimal"
                                placeholder="returns"
                                aria-label="Returns"
                                value={returnInput}
                                onChange={(e) => setReturnInput(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                              <span className="auction-human-prefix">%</span>
                            </span>
                          )}
                          <button type="submit" className="btn btn-solar">
                            Submit bid <span className="btn-arrow">→</span>
                          </button>
                        </form>
                        {previewLandedRate !== null && (
                          <p className="auction-human-hint">
                            Your landed rate: <strong>₹{previewLandedRate.toFixed(2)}/unit</strong>
                          </p>
                        )}
                        <p className="auction-human-hint">
                          {state.useLandedRate
                            ? `Your landed rate must be at least ₹${state.minUndercut.toFixed(2)} below the current lowest landed rate.`
                            : `Must be at least ₹${state.minUndercut.toFixed(2)} below the current lowest bid.`}
                        </p>
                        {bidError && <p className="auction-human-error">{bidError}</p>}
                      </div>
                    )}

                    {winner && (
                      <div className="auction-winner auction-winner-top">
                        <span className="ac-label">Winning bid</span>
                        <strong>{winner.alias ?? 'Unknown'} at ₹{winner.amount.toFixed(2)}/unit</strong>
                        <p className="auction-human-hint">{winner.disclosure}</p>
                        {revealedCounterparty && (
                          <p className="auction-human-hint">
                            <strong>{revealedCounterparty.alias}</strong> is <strong>{revealedCounterparty.organizationName}</strong> — contact details for the PPA go through your usual channel.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
