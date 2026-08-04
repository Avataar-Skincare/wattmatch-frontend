import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import PersonaGenerators from '../components/PersonaGenerators';
import { generatorOffers, vettingProcess } from '../data/content';

const whyGeneratorsChoose = [
  { title: 'No sales or BD team required', body: 'Wattmatch brings qualified, ready-to-transact C&I demand straight to your pipeline.' },
  { title: 'We vet you once', body: "Clients don't have to take our word for it: they see the check. Get vetted once, and the door to real demand opens." },
  { title: 'Trust, transferred', body: 'Our mechanisms give C&I clients the confidence to award business to a smaller or newer name.' },
  { title: 'Compete on merit, not brand', body: 'A well-run new entrant can now win on price and terms, not just recognition.' },
  { title: 'A constant, qualified pipeline', body: 'Instead of expensive, uncertain business development, demand comes to them.' },
  { title: 'Standardised, bankable contracts', body: 'Pre-vetted PPAs, escrow-backed payments, and marketplace-managed dispute resolution.' },
];

export default function ForGeneratorsPage() {
  return (
    <div className="content-page">
      <Seo
        title="For generators"
        description="Access, not expertise, is the barrier for solar generators looking to reach C&I demand. Wattmatch removes it."
        path="/for-generators"
      />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">For generators</span>
            <h1>Access, not expertise, is the barrier. We remove it.</h1>
            <p>
              Building a renewables plant takes relatively little specialised expertise. What keeps new
              entrants out is access to customers, and someone backing their credibility. Wattmatch
              is that backing. Today, a handful of players dominate C&amp;I generator relationships,
              not because they build better plants, but because they already have the client access
              and trust that new entrants lack.
            </p>
          </div>
        </div>

        <section>
          <div className="wrap">
            <Reveal className="sec-head center">
              <span className="eyebrow">Why generators choose Wattmatch</span>
              <h2>We level the field</h2>
            </Reveal>
            <Reveal className="mgmt-grid">
              {whyGeneratorsChoose.map((item, i) => (
                <div className="mgmt-card" key={item.title}>
                  <span className="num" style={{ display: 'block', marginBottom: 6 }}>{String(i + 1).padStart(2, '0')}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section style={{ background: 'var(--porcelain-2)' }}>
          <div className="wrap">
            <Reveal className="sec-head center">
              <span className="eyebrow">What Wattmatch does for you</span>
              <h2>Beyond the match itself</h2>
            </Reveal>
            <Reveal className="mgmt-grid">
              {generatorOffers.map((item) => (
                <div className="mgmt-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section>
          <div className="wrap">
            <Reveal className="sec-head center">
              <span className="eyebrow">The vetting process</span>
              <h2>Get checked once, unlock the whole pipeline</h2>
            </Reveal>
            <Reveal className="mgmt-grid">
              {vettingProcess.map((item, i) => (
                <div className="mgmt-card" key={item.title}>
                  <span className="num" style={{ display: 'block', marginBottom: 6 }}>{i + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <PersonaGenerators />
      </main>
      <Footer />
    </div>
  );
}
