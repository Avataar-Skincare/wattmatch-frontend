import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import { regulatoryProcessSteps, regulatoryCharges } from '../data/content';

export default function RegulatoryGuidePage() {
  return (
    <div className="content-page">
      <Seo
        title="Regulatory guide"
        description="A general framework for how open access and renewable procurement work in India, state by state."
        path="/regulatory-guide"
      />
      <Header />
      <main>
        <div className="page-hero">
          <div className="wrap">
            <span className="eyebrow">Resources</span>
            <h1>Regulatory guide: the process for obtaining renewable power</h1>
            <p>
              A general framework for how open access and renewable procurement work in India. Rules
              vary by state: treat this as an orientation, not a substitute for state-specific advice.
            </p>
          </div>
        </div>

        <section>
          <div className="wrap prose">
            <div className="legal-notice">
              <strong>Important:</strong> Open access is regulated at the state level by each State
              Electricity Regulatory Commission (SERC), operating within the national framework set by
              the Ministry of Power and CERC. Specific thresholds, charges, and timelines vary by state:
              always confirm current rules with your DISCOM or a qualified advisor before proceeding.
              Wattmatch's marketplace is designed to manage this complexity on your behalf.
            </div>

            <Reveal className="legal-block">
              <h2>The national framework</h2>
              <p>
                Open access in India sits within a small set of central frameworks: the Electricity
                Act, 2003 establishes the right to open access; the Green Open Access Rules, 2022
                lowered the minimum eligible load to 100 kW and simplified procedures; and the
                Renewable Consumption Obligation (RCO), under the Energy Conservation (Amendment) Act,
                2022, sets a binding renewable-consumption target for large consumers, DISCOMs and
                captive users.
              </p>
            </Reveal>
          </div>
        </section>

        <section style={{ background: 'var(--porcelain-2)' }}>
          <div className="wrap">
            <Reveal className="sec-head center">
              <span className="eyebrow">Step by step</span>
              <h2>The general process</h2>
            </Reveal>
            <Reveal className="journey-list">
              {regulatoryProcessSteps.map((step, i) => (
                <div className="journey-item" key={step.title}>
                  <span className="journey-num">{i + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section>
          <div className="wrap">
            <Reveal className="sec-head center">
              <span className="eyebrow">Charges you're likely to encounter</span>
              <h2>What each charge means</h2>
            </Reveal>
            <Reveal className="reg-table-wrap">
              <table className="reg-table">
                <thead>
                  <tr>
                    <th>Charge</th>
                    <th>What it is</th>
                  </tr>
                </thead>
                <tbody>
                  {regulatoryCharges.map((row) => (
                    <tr key={row.charge}>
                      <td>{row.charge}</td>
                      <td>{row.what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          </div>
        </section>

        <section style={{ background: 'var(--porcelain-2)' }}>
          <div className="wrap prose">
            <Reveal className="legal-block">
              <h2>The RCO compliance angle</h2>
              <p>
                If your organisation is a "designated consumer" under India's energy conservation
                framework, RCO isn't optional: it requires you to actually consume a rising share of
                renewable power, from roughly 30% today to 43.33% by FY 2029–30, enforced by the
                Bureau of Energy Efficiency. Non-compliance carries a buyout penalty set by CERC.
                Switching to open access solar is currently the most direct compliance path for most
                large consumers.
              </p>
              <p>
                This is genuinely complex, and it changes by state. Wattmatch's marketplace is built to
                navigate this for you, aggregating state-specific regulatory data and appointing
                dedicated state-level teams to manage licensing and connectivity on your behalf.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="contact">
          <div className="wrap">
            <h2>See how Wattmatch manages this for you</h2>
            <Link to="/for-ci" className="btn btn-solar">For C&amp;I buyers <span className="btn-arrow">→</span></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
