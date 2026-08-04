import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';

const infoCards = [
  { title: 'Grid tariffs vary a lot by state', body: 'Industrial and commercial DISCOM tariffs currently range roughly ₹6–₹15 per unit across India, depending on the state and consumer category.' },
  { title: 'So do open-access renewables tariffs', body: 'Landed open-access renewables costs, including wheeling and other charges, typically run ₹4–₹6.5 per unit, again varying by state and structure.' },
  { title: 'The gap only widens', body: "Grid tariffs have historically risen 5–8% a year (up to 15% in some states), while a renewables PPA locks your rate in for the contract term, so today's saving tends to grow, not shrink, over time." },
];

export default function SavingsCalculatorPage() {
  const [consumption, setConsumption] = useState('50000');
  const [tariff, setTariff] = useState('9');

  const { monthlyCost, lowSaving, highSaving } = useMemo(() => {
    const c = Number(consumption) || 0;
    const t = Number(tariff) || 0;
    const cost = c * t;
    return { monthlyCost: cost, lowSaving: cost * 0.25, highSaving: cost * 0.5 };
  }, [consumption, tariff]);

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  return (
    <div className="content-page">
      <Seo
        title="Savings calculator"
        description="Estimate how much you could save by switching to open-access renewable power in India."
        path="/savings-calculator"
      />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Resources</span>
            <h1>How much could you save by switching?</h1>
            <p>
              A quick estimate based on published industry cost ranges. For a precise number specific
              to your load, request a match: it costs nothing to find out.
            </p>
          </div>
        </div>

        <section>
          <div className="wrap">
            <Reveal className="sec-head center">
              <span className="eyebrow">The cost case</span>
              <h2>Estimate your savings</h2>
              <p>
                Enter your current monthly electricity consumption and average tariff. We'll apply the
                typical 25–50% savings range seen by C&amp;I buyers switching to open-access solar in
                India, based on current published grid (₹6–₹15/unit) and solar (₹4–₹6.5/unit) tariff data.
              </p>
            </Reveal>

            <Reveal className="calc-grid">
              <div className="form-card">
                <h3>Your consumption</h3>
                <p className="sub">Estimate is for illustration only, not a quote.</p>
                <div className="field">
                  <label htmlFor="calcConsumption">Current monthly consumption (kWh)</label>
                  <input
                    id="calcConsumption"
                    type="number"
                    min="0"
                    value={consumption}
                    onChange={(e) => setConsumption(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
                <div className="field">
                  <label htmlFor="calcTariff">Average grid tariff (₹/unit)</label>
                  <input
                    id="calcTariff"
                    type="number"
                    min="0"
                    step="0.1"
                    value={tariff}
                    onChange={(e) => setTariff(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
              </div>

              <div className="calc-result">
                <span className="cr-label">Current monthly cost</span>
                <span className="cr-value">{fmt(monthlyCost)}</span>
                <span className="cr-label" style={{ marginTop: 18 }}>Estimated monthly saving</span>
                <span className="cr-value" style={{ fontSize: 28 }}>{fmt(lowSaving)} – {fmt(highSaving)}</span>
                <span className="cr-range">
                  Based on a typical 25–50% saving vs. your current DISCOM cost, switching to
                  open-access solar.
                </span>
              </div>
            </Reveal>
            <p className="calc-note">
              This is an estimate for illustration only, based on published state-level tariff ranges,
              not a quote. Actual savings depend on your state, load profile, connected voltage, and
              contract structure.
            </p>
          </div>
        </section>

        <section style={{ background: 'var(--porcelain-2)' }}>
          <div className="wrap">
            <Reveal className="mgmt-grid">
              {infoCards.map((c) => (
                <div className="mgmt-card" key={c.title}>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              ))}
            </Reveal>
            <Reveal className="example-box" style={{ maxWidth: 620, margin: '24px auto 0' }}>
              <span className="ex-icon">→</span>
              <div>
                <div className="ex-headline">A real deal, for scale</div>
                <div className="ex-body">
                  A 15 MW facility in Haryana signed a PPA at <strong>₹4.78/unit</strong> against a
                  DISCOM rate of <strong>₹7.32/unit</strong>, a 35% saving, on a real deal.
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="contact">
          <div className="wrap">
            <h2>Want the real number for your load?</h2>
            <p>No cost, no obligation: we'll come back with matched generator options and their actual quoted tariffs.</p>
            <Link to="/for-ci" className="btn btn-solar">Request a match <span className="btn-arrow">→</span></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
