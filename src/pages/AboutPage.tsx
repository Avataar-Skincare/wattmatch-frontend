import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import Team from '../components/Team';
import { modelStats } from '../data/content';

export default function AboutPage() {
  return (
    <div className="content-page">
      <Seo
        title="About Wattmatch"
        description="Solar is 25-50% cheaper than grid power for most Indian C&I buyers. Wattmatch exists to close the gap between generators and buyers."
        path="/about"
      />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">About Wattmatch</span>
            <h1>Built to close a gap that's structural, not economic</h1>
            <p>
              Solar is 25–50% cheaper than grid power for most Indian C&amp;I buyers. Only a fraction
              of that demand has actually moved to solar. Wattmatch exists to close that gap.
            </p>
          </div>
        </div>

        <section>
          <div className="wrap">
            <Reveal className="sec-head center">
              <span className="eyebrow">Our story</span>
              <h2>Two sides of the same broken market</h2>
              <p>
                India's commercial and industrial businesses want to switch to renewables: the economics
                have been compelling for years. Small and new renewable generators are ready to build the
                capacity to serve them. Yet today, neither side can efficiently find or trust the other.
              </p>
            </Reveal>
            <Reveal className="prose" style={{ marginBottom: 48 }}>
              <p>
                C&amp;I buyers face complex, jargon-heavy PPA negotiations with no in-house expertise,
                no structured way to compare generators on price and terms, and a heavy diligence
                burden just to vet a single vendor's credibility. Generators, who often need very
                little specialised expertise to build a quality plant, are locked out simply because
                they lack access to buyers and someone backing their credibility.
              </p>
              <p>
                Wattmatch was built to be that missing layer: a neutral marketplace where verified
                generators compete for C&amp;I demand through transparent auctions, and C&amp;I clients
                get the best deal without touching a single PPA clause themselves.
              </p>
            </Reveal>
            <Reveal className="stat-cards">
              {modelStats.map((s) => (
                <div className="stat-card" key={s.label}>
                  <span className="sc-value">{s.value}</span>
                  <span className="sc-label">{s.label}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section style={{ background: 'var(--porcelain-2)' }}>
          <div className="wrap">
            <Reveal className="sec-head center">
              <span className="eyebrow">Our model</span>
              <h2>What Govt. platforms proved for DISCOMs, we're building for C&amp;I</h2>
            </Reveal>
            <Reveal className="prose">
              <p>
                India doesn't need a new market mechanism invented from scratch. Its own national platform, has already proven the auction-and-intermediary model at
                massive scale: 73.8 GW of capacity awarded, 60+ GW of Power Sale Agreements executed
                with DISCOMs, Wattmatch is the same playbook, rebuilt for the C&amp;I half
                of India's electricity demand that's been left to transact bilaterally, deal by deal,
                ever since.
              </p>
            </Reveal>
          </div>
        </section>

        <Team />

        <section style={{ background: 'var(--porcelain-2)' }}>
          <div className="wrap">
            <Reveal className="sec-head center">
              <span className="eyebrow">Our approach</span>
              <h2>You run your business. We run your renewables.</h2>
              <p>
                No in-house energy team, no consultant, no benchmarking exercise, no legal team: Wattmatch sources,
                vets, negotiates, contracts and monitors your entire renewable transition.
              </p>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
