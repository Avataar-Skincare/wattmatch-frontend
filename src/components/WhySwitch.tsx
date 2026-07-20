import Reveal from './Reveal';
import { beyondCostReasons } from '../data/content';

export default function WhySwitch() {
  return (
    <section id="why-switch" style={{ background: 'var(--porcelain)' }}>
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="eyebrow">Why switch</span>
          <h2>C&amp;I has every reason to switch to renewables</h2>
          <p>The economics alone are compelling — but cost savings are just the beginning.</p>
        </Reveal>

        <div className="ws-grid">
          {/* LEFT: THE COST CASE */}
          <Reveal className="ws-col ws-cost">
            <div className="ws-head ws-head-cost">The cost case</div>

            <div className="tariff-card grid-tariff">
              <span className="tc-label">Grid (DISCOM)</span>
              <span className="tc-value">₹6 – ₹15 <small>/ unit</small></span>
              <span className="tc-note">Industrial &amp; commercial tariffs, varies by state</span>
            </div>

            <div className="tariff-arrow" aria-hidden="true">↓</div>

            <div className="tariff-card solar-tariff">
              <span className="tc-label">Solar C&amp;I (open access)</span>
              <span className="tc-value">₹3 – ₹6 <small>/ unit</small></span>
              <span className="tc-note">Landed cost incl. wheeling &amp; surcharges</span>
            </div>

            <div className="big-saving">
              <span className="bs-num">25–50%</span>
              <span className="bs-label">typical cost saving vs. grid</span>
            </div>

            <div className="example-box">
              <span className="ex-icon">↳</span>
              <div>
                <p className="ex-headline">A 15 MW facility in Haryana signs a 25-year PPA for 5 MW of solar</p>
                <p className="ex-body">
                  Landed solar tariff ₹4.78/unit vs. their DISCOM rate of ₹7.32/unit — a{' '}
                  <strong>35% saving</strong> that compounds every year grid tariffs keep rising.
                </p>
              </div>
            </div>

            <p className="ws-footnote">
              DISCOM tariffs have risen as much as 15%/year in some states, largely on fuel and
              cross-subsidy costs. A solar PPA is fixed for the life of the contract — the gap only
              widens.
            </p>
          </Reveal>

          {/* RIGHT: BEYOND COST */}
          <Reveal className="ws-col ws-reasons">
            <div className="ws-head ws-head-reasons">Beyond cost: more reasons to switch</div>
            {beyondCostReasons.map((r) => (
              <div className="reason-row" key={r.title}>
                <span className="reason-bar" style={{ background: r.color }}></span>
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>

        <p className="ws-source">
          Figures reflect published industry data as of 2025–26 (Saur Energy, CEEW, Optenpower, Hero
          Future Energies, PV Magazine); actual tariffs depend on state, load profile and contract
          structure — always confirmed with a site-specific assessment.
        </p>
      </div>
    </section>
  );
}
