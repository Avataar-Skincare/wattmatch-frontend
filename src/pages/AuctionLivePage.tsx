import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

// Internal PoC test tool (see AUCTION_MVP_PLAN.md) — not linked from site nav/footer. Joins a real
// auction on the wattmatch-server backend via a signed token; other bidders are actual other
// people in their own tabs, not client-side simulation.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

type ConnectionState = 'connecting' | 'connected' | 'error';
type ParticipantRole = 'generator' | 'buyer';

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
  const [feed, setFeed] = useState<string[]>([]);
  const [bidInput, setBidInput] = useState('');
  const [bidError, setBidError] = useState<string | null>(null);
  const [winner, setWinner] = useState<{ alias: string | null; amount: number; disclosure: string } | null>(null);
  const [sessionReplaced, setSessionReplaced] = useState(false);
  const socketRef = useRef<Socket | null>(null);
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
    // Backfills the feed from the server's durable record on (re)connect — without the `prev.length
    // > 0` guard, a feed:sync arriving after a live state:update had already started the feed would
    // wholesale overwrite it and could drop that just-received live entry.
    socket.on('feed:sync', (bids: { alias: string; amount: number }[]) => {
      setFeed((prev) => (prev.length > 0 ? prev : bids.map((b) => `${b.alias} bid ₹${b.amount.toFixed(2)}/unit`)));
    });
    socket.on(
      'state:update',
      (payload: { currentBid: number; windowEndsAt: number; alias: string }) => {
        setState((prev) => (prev ? { ...prev, currentBid: payload.currentBid, windowEndsAt: payload.windowEndsAt, leaderAlias: payload.alias } : prev));
        setFeed((f) => [`${payload.alias} bid ₹${payload.currentBid.toFixed(2)}/unit`, ...f].slice(0, 10));
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
                        <div className="auction-ring-center auction-live-ring-center">
                          <span className="t">{secondsLeft}</span>
                          <span className="l">sec left</span>
                        </div>
                      )}
                      <div className="auction-price">
                        <span className="ac-label">Current lowest bid</span>
                        <div className="pv">
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

                    <div className="auction-feed">
                      {feed.length === 0 && <p>No bids yet.</p>}
                      {feed.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>

                    {winner && (
                      <div className="auction-winner auction-winner-top">
                        <span className="ac-label">Winning bid</span>
                        <strong>{winner.alias ?? 'Unknown'} at ₹{winner.amount.toFixed(2)}/unit</strong>
                        <p className="auction-human-hint">{winner.disclosure}</p>
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
