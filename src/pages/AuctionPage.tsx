import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

const DISCOM_RATE = 7.32; // ₹/unit — same Haryana DISCOM benchmark used elsewhere on the site
const BID_FLOOR = 4.2; // ₹/unit — realistic landed-cost floor for open-access solar
// The lowest bid submitted on the enrollment form — every qualified bidder opens
// the live auction here, all level, not at individually randomised starting points.
const OPENING_BID = 7.2;
// Anti-sniping window: every new lowest bid resets the clock. The auction only
// closes once a full window passes with no bid at all — same rule as the real
// platform's planned 8-*minute* window (IMPLEMENTATION_PLAN.md Phase 4), just
// scaled to 8 *seconds* so a demo actually finishes.
const WINDOW_SECONDS = 8;
// Kept low on purpose — with 6 bidders, a higher chance means a bid almost every
// tick, so the countdown resets before it ever visibly ticks down. This lets the
// clock actually move (and be seen resetting) between bids.
const DROP_CHANCE = 0.15; // per virtual bidder, per tick
// Deliberately small — real bidders undercut by whatever amount they choose
// (as little as 1 paisa), not in big fixed jumps. Small steps also mean the
// ~₹2/unit range down to the floor takes many more ticks to close out, so a
// natural, hands-off run plays out over roughly a minute-plus instead of
// finishing in a matter of seconds.
const MIN_DROP = 0.03;
const MAX_DROP = 0.09;
// Real platform rule (confirmed by founder S K Mishra): no fixed step — a bid
// just needs to be at least 1 paisa below the current lowest bid.
const MIN_UNDERCUT = 0.01;

// Anonymised on purpose — mirrors the real platform's planned alias vault
// (IMPLEMENTATION_PLAN.md Phase 4), where bidder identity stays hidden until reveal.
// A wider pool than the 6 seats in play, shuffled per run, so a repeat demo in
// front of the same client doesn't show the same aliases every time.
const NAME_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
const SEAT_COUNT = 6; // 5 virtual generators + the operator, playing as a live bidder
// One consistent color per seat (by id) — carried onto its avatar chip.
const GEN_COLORS = ['#C98423', '#3E8FA6', '#C1703A', '#7A66C4', '#3F8F5E', '#B5504F'];

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface Bidder {
  id: number;
  name: string;
  bid: number;
  isHuman: boolean;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function makeBidders(): Bidder[] {
  const letters = shuffle(NAME_LETTERS).slice(0, SEAT_COUNT);
  const humanSeat = Math.floor(Math.random() * SEAT_COUNT);
  return letters.map((letter, id) => ({
    id,
    name: `Generator ${letter}`,
    bid: OPENING_BID,
    isHuman: id === humanSeat,
  }));
}

type Stage = 'welcome' | 'reveal' | 'running' | 'closed';

export default function AuctionPage() {
  const [stage, setStage] = useState<Stage>('welcome');
  const [bidders, setBidders] = useState<Bidder[]>(makeBidders);
  const [timeLeft, setTimeLeft] = useState(WINDOW_SECONDS);
  const [feed, setFeed] = useState<string[]>([]);
  const [flashId, setFlashId] = useState<number | null>(null);
  const [humanInput, setHumanInput] = useState('');
  const [humanError, setHumanError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  // Welcome -> Reveal: assign fresh disguised names/seats and show the rate to beat.
  function prepareAuction() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setBidders(makeBidders());
    setFeed([]);
    setTimeLeft(WINDOW_SECONDS);
    setFlashId(null);
    setStage('reveal');
  }

  // Reveal -> Running: start the live clock and the virtual bidders' auto-drops.
  function beginBidding() {
    setFeed([`Auction opened — the clock resets on every new bid; it closes after a quiet window (8 min on the real platform, sped up to ${WINDOW_SECONDS}s here).`]);
    setStage('running');

    intervalRef.current = setInterval(() => {
      setBidders((prev) => {
        // BID_FLOOR is a hard economic floor — once anyone (human included) is
        // sitting on it, nobody can legitimately underbid them, so the auction is
        // already decided. Stop all further bidding and just let the anti-sniping
        // clock run out uninterrupted to close it.
        const floorTouched = prev.some((b) => b.bid <= BID_FLOOR);
        if (floorTouched) {
          setTimeLeft((t) => {
            if (t <= 1) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              setStage('closed');
              return 0;
            }
            return t - 1;
          });
          return prev;
        }

        // Only one number ever matters — the current market lowest — same as the
        // real platform's single-`currentBid` Redis key. A virtual bidder's move
        // must undercut THAT, not just their own last bid, to count as a real move.
        const currentLowest = Math.min(...prev.map((b) => b.bid));

        // Only let one virtual bidder drop per tick, so the feed reads as a sequence of events.
        let changed: Bidder | null = null;
        const next = prev.map((b) => {
          if (changed || b.isHuman || b.bid <= BID_FLOOR || Math.random() > DROP_CHANCE) return b;
          const nextBid = Math.max(BID_FLOOR, Number((currentLowest - randomBetween(MIN_DROP, MAX_DROP)).toFixed(2)));
          if (nextBid >= currentLowest) return b;
          changed = { ...b, bid: nextBid };
          return changed;
        });
        if (changed) {
          // A new bid came in — reset the window instead of just letting time tick down.
          const c = changed as Bidder;
          setFeed((f) => [`${c.name} undercut to ₹${c.bid.toFixed(2)}/unit`, ...f].slice(0, 8));
          setTimeLeft(WINDOW_SECONDS);
          setFlashId(c.id);
          if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
          flashTimeoutRef.current = setTimeout(() => setFlashId(null), 600);
        } else {
          // No bid this tick — count the silent window down toward close.
          setTimeLeft((t) => {
            if (t <= 1) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              setStage('closed');
              return 0;
            }
            return t - 1;
          });
        }
        return next;
      });
    }, 1000);
  }

  // The operator's own bid — typed in manually, same as a real generator logging
  // into the platform, per the founder-confirmed rule: no preset steps, just any
  // amount at least 1 paisa below the current lowest bid.
  function submitHumanBid(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (stage !== 'running' || !human || !winner) return;
    if (winner.bid <= BID_FLOOR) return; // floor already reached, bidding is frozen

    const amount = Number(humanInput);
    if (!humanInput.trim() || Number.isNaN(amount)) {
      setHumanError('Enter a valid amount.');
      return;
    }
    const rounded = Number(amount.toFixed(2));
    if (rounded < BID_FLOOR) {
      setHumanError(`Can't go below the demo floor of ₹${BID_FLOOR.toFixed(2)}.`);
      return;
    }
    const maxAllowed = Number((winner.bid - MIN_UNDERCUT).toFixed(2));
    if (rounded > maxAllowed) {
      setHumanError(`Must be at least ₹${MIN_UNDERCUT.toFixed(2)} below the current lowest bid of ₹${winner.bid.toFixed(2)}.`);
      return;
    }

    setHumanError(null);
    setHumanInput('');
    setBidders((prev) => prev.map((b) => (b.id === human.id ? { ...b, bid: rounded } : b)));
    setFeed((f) => [`${human.name} (you) bid ₹${rounded.toFixed(2)}/unit`, ...f].slice(0, 8));
    setTimeLeft(WINDOW_SECONDS);
    setFlashId(human.id);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlashId(null), 600);
  }

  const sorted = [...bidders].sort((a, b) => a.bid - b.bid);
  const winner = sorted[0];
  const human = bidders.find((b) => b.isHuman);
  const savingsPct = winner ? Math.round(((DISCOM_RATE - winner.bid) / DISCOM_RATE) * 100) : 0;
  const gaugePct = winner
    ? Math.min(100, Math.max(0, ((DISCOM_RATE - winner.bid) / (DISCOM_RATE - BID_FLOOR)) * 100))
    : 0;
  const ringOffset = RING_CIRCUMFERENCE * (1 - timeLeft / WINDOW_SECONDS);
  const inRoom = stage === 'running' || stage === 'closed';
  const floorReached = Boolean(winner && winner.bid <= BID_FLOOR);

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
              auction closes — and one seat is played live, by whoever is running this demo.
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

            {stage === 'welcome' && (
              <div className="auction-start">
                <p className="auction-welcome-copy">
                  You'll play one of the six bidders yourself — the rest are simulated generators.
                  Undercut the market to win.
                </p>
                <button type="button" className="btn btn-solar" onClick={prepareAuction}>
                  Join the auction <span className="btn-arrow">→</span>
                </button>
              </div>
            )}

            {stage === 'reveal' && (
              <div className="auction-reveal">
                <span className="ac-label">Rate to beat</span>
                <div className="auction-reveal-rate">₹{DISCOM_RATE.toFixed(2)}<sup>/unit</sup></div>
                <p>
                  That's today's DISCOM rate. Every generator already qualified below it on the
                  enrollment form — the live auction opens level, at ₹{OPENING_BID.toFixed(2)}/unit,
                  the lowest bid submitted there. From here it only goes lower.
                </p>
                <button type="button" className="btn btn-solar" onClick={beginBidding}>
                  Start bidding <span className="btn-arrow">→</span>
                </button>
              </div>
            )}

            {inRoom && (
              <div className="auction-room">
                <div className="auction-room-head">
                  <span className={`auction-status${stage === 'running' ? ' live' : ''}`}>
                    <span className="dot"></span>
                    {stage === 'running' ? 'Live — closes after 8 min of no bids (sped up to 8s here)' : 'Auction closed'}
                  </span>
                </div>

                {stage === 'closed' && winner && (
                  <div className="auction-winner auction-winner-top">
                    <span className="ac-label">Winning bid</span>
                    <strong>{winner.name}{winner.isHuman ? ' (you)' : ''} at ₹{winner.bid.toFixed(2)}/unit</strong>
                    <p>{savingsPct}% below the ₹{DISCOM_RATE.toFixed(2)}/unit DISCOM rate — locked for 25 years.</p>
                    <button type="button" className="btn btn-outline" onClick={prepareAuction}>
                      Run it again
                    </button>
                  </div>
                )}

                <div className="auction-centerpiece">
                  <div className={`auction-ring-wrap${flashId !== null ? ' flash' : ''}`}>
                    <svg viewBox="0 0 120 120">
                      <circle className="auction-ring-track" cx="60" cy="60" r={RING_RADIUS} />
                      <circle
                        className={`auction-ring-fill${flashId !== null ? ' reset' : ''}`}
                        cx="60" cy="60" r={RING_RADIUS}
                        strokeDasharray={RING_CIRCUMFERENCE}
                        strokeDashoffset={stage === 'running' ? ringOffset : 0}
                      />
                    </svg>
                    <div className="auction-ring-center">
                      <span className="t">{stage === 'running' ? timeLeft : 0}</span>
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
                      className={`gcard${i === 0 ? ' leading' : ''}${flashId === b.id ? ' flash' : ''}${b.isHuman ? ' you' : ''}`}
                    >
                      {i === 0 ? (
                        <span className="gtag">{stage === 'running' ? 'Leading' : 'Winner'}</span>
                      ) : b.isHuman ? (
                        <span className="gtag you">You</span>
                      ) : null}
                      <div className="avatar" style={{ background: GEN_COLORS[b.id] }}>
                        {b.name.slice(-1)}
                      </div>
                      <div className="gname">{b.name}</div>
                      <div className="gbid">₹{b.bid.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                {stage === 'running' && human && winner && (
                  <div className="auction-human-controls">
                    <span className="ac-label">
                      Your move — {human.name}, current bid ₹{human.bid.toFixed(2)}/unit
                    </span>
                    <form className="auction-human-form" onSubmit={submitHumanBid}>
                      <span className="auction-human-form-field">
                        <span className="auction-human-prefix">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          placeholder={`below ${winner.bid.toFixed(2)}`}
                          value={humanInput}
                          onChange={(e) => setHumanInput(e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          disabled={floorReached}
                        />
                      </span>
                      <button type="submit" className="btn btn-solar" disabled={floorReached}>
                        Submit bid <span className="btn-arrow">→</span>
                      </button>
                    </form>
                    <p className="auction-human-hint">
                      Must be at least ₹{MIN_UNDERCUT.toFixed(2)} below the current lowest bid — no fixed step, type any amount.
                    </p>
                    {humanError && <p className="auction-human-error">{humanError}</p>}
                    {floorReached && (
                      <p className="auction-human-floor">
                        {human.bid <= BID_FLOOR
                          ? "You've hit the floor price — nobody can go lower. Closing…"
                          : `${winner.name} hit the floor price first — nobody can go lower. Closing…`}
                      </p>
                    )}
                  </div>
                )}

                <div className="auction-feed">
                  {feed.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
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
