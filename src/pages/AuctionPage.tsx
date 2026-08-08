import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

const DISCOM_RATE = 7.32; // ₹/unit — same Haryana DISCOM benchmark used elsewhere on the site
const BID_FLOOR = 4.2; // ₹/unit — realistic landed-cost floor for open-access solar
// Anti-sniping window: every new lowest bid resets the clock. The auction only
// closes once a full window passes with no bid at all — same rule as the real
// platform's planned 8-*minute* window (IMPLEMENTATION_PLAN.md Phase 4), just
// scaled to 8 *seconds* so a demo actually finishes.
const WINDOW_SECONDS = 8;
// Kept low on purpose — with 5 bidders, a higher chance means a bid almost every
// tick, so the countdown resets before it ever visibly ticks down. This lets the
// clock actually move (and be seen resetting) between bids.
const DROP_CHANCE = 0.15; // per bidder, per tick
// Step size is tuned so 5 bidders reliably burn through the ~₹2/unit range down
// to the floor in a reasonable demo length — with only one visible drop per tick
// (for a readable feed) and a rule that ANY drop resets the window, small steps
// would need far too many ticks before the market can ever go quiet.
const MIN_DROP = 0.15;
const MAX_DROP = 0.45;

// Anonymised on purpose — mirrors the real platform's planned alias vault
// (IMPLEMENTATION_PLAN.md Phase 4), where bidder identity stays hidden until reveal.
const BIDDER_NAMES = ['Generator A', 'Generator B', 'Generator C', 'Generator D', 'Generator E'];
// One consistent color per generator (by id) — carried onto its avatar chip.
const GEN_COLORS = ['#C98423', '#3E8FA6', '#C1703A', '#7A66C4', '#3F8F5E'];

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface Bidder {
  id: number;
  name: string;
  bid: number;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeBidders(): Bidder[] {
  return BIDDER_NAMES.map((name, id) => ({ id, name, bid: Number(randomBetween(6.1, 6.6).toFixed(2)) }));
}

type Status = 'idle' | 'running' | 'closed';

export default function AuctionPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [bidders, setBidders] = useState<Bidder[]>(makeBidders);
  const [timeLeft, setTimeLeft] = useState(WINDOW_SECONDS);
  const [feed, setFeed] = useState<string[]>([]);
  const [flashId, setFlashId] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  function start() {
    setBidders(makeBidders());
    setFeed([`Auction opened — the clock resets on every new bid; it closes after a quiet window (8 min on the real platform, sped up to ${WINDOW_SECONDS}s here).`]);
    setTimeLeft(WINDOW_SECONDS);
    setFlashId(null);
    setStatus('running');

    intervalRef.current = setInterval(() => {
      setBidders((prev) => {
        // Only let one bidder drop per tick, so the feed reads as a sequence of events.
        let changed: Bidder | null = null;
        const next = prev.map((b) => {
          if (changed || b.bid <= BID_FLOOR || Math.random() > DROP_CHANCE) return b;
          const nextBid = Math.max(BID_FLOOR, Number((b.bid - randomBetween(MIN_DROP, MAX_DROP)).toFixed(2)));
          if (nextBid >= b.bid) return b;
          changed = { ...b, bid: nextBid };
          return changed;
        });
        if (changed) {
          // A new bid came in — reset the window instead of just letting time tick down.
          const c = changed as Bidder;
          setFeed((f) => [`${c.name} dropped to ₹${c.bid.toFixed(2)}/unit`, ...f].slice(0, 8));
          setTimeLeft(WINDOW_SECONDS);
          setFlashId(c.id);
          if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
          flashTimeoutRef.current = setTimeout(() => setFlashId(null), 600);
        } else {
          // No bid this tick — count the silent window down toward close.
          setTimeLeft((t) => {
            if (t <= 1) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              setStatus('closed');
              return 0;
            }
            return t - 1;
          });
        }
        return next;
      });
    }, 1000);
  }

  const sorted = [...bidders].sort((a, b) => a.bid - b.bid);
  const winner = sorted[0];
  const savingsPct = winner ? Math.round(((DISCOM_RATE - winner.bid) / DISCOM_RATE) * 100) : 0;
  const gaugePct = winner
    ? Math.min(100, Math.max(0, ((DISCOM_RATE - winner.bid) / (DISCOM_RATE - BID_FLOOR)) * 100))
    : 0;
  const ringOffset = RING_CIRCUMFERENCE * (1 - timeLeft / WINDOW_SECONDS);

  return (
    <div className="content-page">
      <Seo
        title="Auction simulator"
        description="See how a Wattmatch reverse auction drives down tariffs — an illustrative, simulated demo."
        path="/auction"
      />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Auction simulator</span>
            <h1>Watch a Wattmatch reverse auction happen live</h1>
            <p>
              An illustrative simulation of how the reverse auction drives your tariff down — verified
              generators compete, the lowest live bid leads, and every new bid resets the clock. On
              the real platform that window is 8 minutes; this demo compresses it to {WINDOW_SECONDS}{' '}
              seconds so you can watch a full auction play out. Bidders are shown only as anonymous
              aliases below, the same way identities stay hidden on the real platform until the
              auction closes.
            </p>
          </div>
        </div>

        <section>
          <div className="wrap">
            <div className="auction-brief">
              <div>
                <span className="ac-label">Buyer requirement</span>
                <strong>5 MW · Open access solar · Haryana</strong>
              </div>
              <div>
                <span className="ac-label">Current DISCOM rate</span>
                <strong>₹{DISCOM_RATE.toFixed(2)} / unit</strong>
              </div>
              <div>
                <span className="ac-label">Contract tenure</span>
                <strong>25 years</strong>
              </div>
            </div>

            {status === 'idle' && (
              <div className="auction-start">
                <button type="button" className="btn btn-solar" onClick={start}>
                  Start auction <span className="btn-arrow">→</span>
                </button>
              </div>
            )}

            {status !== 'idle' && (
              <div className="auction-room">
                <div className="auction-room-head">
                  <span className={`auction-status${status === 'running' ? ' live' : ''}`}>
                    <span className="dot"></span>
                    {status === 'running' ? 'Live — closes after 8 min of no bids (sped up to 8s here)' : 'Auction closed'}
                  </span>
                </div>

                <div className="auction-centerpiece">
                  <div className={`auction-ring-wrap${flashId !== null ? ' flash' : ''}`}>
                    <svg viewBox="0 0 120 120">
                      <circle className="auction-ring-track" cx="60" cy="60" r={RING_RADIUS} />
                      <circle
                        className={`auction-ring-fill${flashId !== null ? ' reset' : ''}`}
                        cx="60" cy="60" r={RING_RADIUS}
                        strokeDasharray={RING_CIRCUMFERENCE}
                        strokeDashoffset={status === 'running' ? ringOffset : 0}
                      />
                    </svg>
                    <div className="auction-ring-center">
                      <span className="t">{status === 'running' ? timeLeft : 0}</span>
                      <span className="l">sec left</span>
                    </div>
                  </div>

                  {winner && (
                    <div className="auction-price">
                      <span className="ac-label">Current lowest bid</span>
                      <div className={`pv${flashId !== null ? ' pulse' : ''}`}>
                        ₹{winner.bid.toFixed(2)}<sup>/unit</sup>
                      </div>
                      <div className="pd">▼ {savingsPct}% below ₹{DISCOM_RATE.toFixed(2)} DISCOM rate</div>
                    </div>
                  )}

                  <div className="auction-gauge">
                    <div className="auction-gauge-track">
                      <div className="auction-gauge-fill" style={{ width: `${gaugePct}%` }}></div>
                    </div>
                    <div className="auction-gauge-labels">
                      <span>₹{DISCOM_RATE.toFixed(2)} DISCOM</span>
                      <span>₹{BID_FLOOR.toFixed(2)} floor</span>
                    </div>
                  </div>
                </div>

                <div className="auction-podium">
                  {sorted.map((b, i) => (
                    <div
                      key={b.id}
                      className={`gcard${i === 0 ? ' leading' : ''}${flashId === b.id ? ' flash' : ''}`}
                    >
                      {i === 0 && (
                        <span className="gtag">{status === 'running' ? 'Leading' : 'Winner'}</span>
                      )}
                      <div className="avatar" style={{ background: GEN_COLORS[b.id] }}>
                        {b.name.slice(-1)}
                      </div>
                      <div className="gname">{b.name}</div>
                      <div className="gbid">₹{b.bid.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="auction-feed">
                  {feed.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>

                {status === 'closed' && winner && (
                  <div className="auction-winner">
                    <span className="ac-label">Winning bid</span>
                    <strong>{winner.name} at ₹{winner.bid.toFixed(2)}/unit</strong>
                    <p>{savingsPct}% below the ₹{DISCOM_RATE.toFixed(2)}/unit DISCOM rate — locked for 25 years.</p>
                    <button type="button" className="btn btn-outline" onClick={start}>
                      Run it again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="contact">
          <div className="wrap">
            <h2>Want the real numbers for your load?</h2>
            <Link to="/for-ci" className="btn btn-solar">Request a match <span className="btn-arrow">→</span></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
