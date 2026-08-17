import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

// Internal PoC test tool (see AUCTION_MVP_PLAN.md) — not linked from site nav/footer. Joins a real
// auction on the wattmatch-server backend via a signed token; other bidders are actual other
// people in their own tabs, not client-side simulation.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

// Matches the countdown ring already used by the /auction demo page — same radius/circumference,
// same CSS classes, so this reuses styling that already exists rather than inventing new rules.
const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type ConnectionState = 'connecting' | 'connected' | 'error';
type ParticipantRole = 'generator' | 'buyer';

// Reads the auctionId claim out of the join token's payload segment — not a verification (the
// server re-verifies the token's signature on every real request), just enough to know which
// auction to ask /winner-identity about. A malformed/unreadable token here just means the reveal
// call never fires; the socket connection itself (which does verify the token) already handles
// the real "is this token valid" case.
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
}

export default function AuctionLivePage() {
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
  const [bidInput, setBidInput] = useState('');
  const [bidError, setBidError] = useState<string | null>(null);
  const [winner, setWinner] = useState<{ alias: string | null; amount: number; disclosure: string } | null>(null);
  // Real identity (organizationName), not just alias — populated only if the /winner-identity
  // reveal succeeds, which the backend restricts to the winning generator and the buyer only (see
  // auctionAdmin.ts). Every other role gets a 403 there, so this simply stays null for them — not
  // an error state, just nothing to show.
  const [revealedCounterparty, setRevealedCounterparty] = useState<{ alias: string; organizationName: string } | null>(null);
  const [sessionReplaced, setSessionReplaced] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef<string | null>(null);
  // Socket event handlers below are wired up once (empty-deps effect), so they'd otherwise close
  // over the initial null `state` forever — this ref gives them a live read of the latest value.
  const stateRef = useRef<AuctionState | null>(null);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setConnection('error');
      setConnectionError('No join token in the URL — use the link generated for you.');
      return;
    }
    tokenRef.current = token;

    // Default Socket.io path — kept separate from /api/*; needs its own CloudFront routing rule
    // in production rather than piggybacking on the REST API. See AUCTION_PLAN.md.
    const socket = io(API_BASE, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => setConnection('connected'));
    socket.on('connect_error', (err) => {
      setConnection('error');
      setConnectionError(err.message || 'Could not connect.');
    });
    socket.on('you:info', (payload: { alias: string; role: ParticipantRole; rulesAccepted: boolean }) => {
      setMyAlias(payload.alias);
      setMyRole(payload.role);
      setRulesAccepted(payload.rulesAccepted);
    });
    socket.on('rules:accepted', () => setRulesAccepted(true));
    socket.on('state:sync', (payload: AuctionState | null) => setState(payload));
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
      (payload: { winnerAlias: string | null; winningBid: number; resultType: string; disclosure: string }) => {
        setState((prev) => (prev ? { ...prev, status: 'closed' } : prev));
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

    return () => {
      socket.disconnect();
    };
  }, []);

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
  // generator and the buyer (auctionAdmin.ts), so a losing generator's request just comes back
  // 403 and revealedCounterparty simply stays null — no separate role check needed here.
  useEffect(() => {
    if (!winner) return;
    const token = tokenRef.current;
    const auctionId = token ? decodeAuctionIdFromToken(token) : null;
    if (!token || auctionId === null) return;

    let cancelled = false;
    fetch(`${API_BASE}/api/auction-admin/auctions/${auctionId}/winner-identity`, {
      headers: { Authorization: `Bearer ${token}` },
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
  }, [winner]);

  function submitBid(e: React.FormEvent) {
    e.preventDefault();
    setBidError(null);
    const amount = Number(bidInput);
    if (!bidInput.trim() || Number.isNaN(amount) || amount <= 0) {
      setBidError('Enter a valid amount.');
      return;
    }
    socketRef.current?.emit('bid:new', { amount });
    setBidInput('');
  }

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
                {connection === 'error' && (
                  <p style={{ textAlign: 'center', color: '#B53A3A' }}>{connectionError}</p>
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
                        <span className="ac-label">Current lowest bid</span>
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
                            <li>
                              Current lowest bid is ₹{state.currentBid.toFixed(2)}/unit — bids only go down, and a
                              valid bid must be at least ₹{state.minUndercut.toFixed(2)} below it.
                            </li>
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
                              placeholder={`below ${state.currentBid.toFixed(2)}`}
                              value={bidInput}
                              onChange={(e) => setBidInput(e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          </span>
                          <button type="submit" className="btn btn-solar">
                            Submit bid <span className="btn-arrow">→</span>
                          </button>
                        </form>
                        <p className="auction-human-hint">
                          Must be at least ₹{state.minUndercut.toFixed(2)} below the current lowest bid.
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
