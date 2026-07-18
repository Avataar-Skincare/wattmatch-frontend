import Reveal from './Reveal';
import { howItWorksSteps } from '../data/content';

export default function HowItWorks() {
  return (
    <section id="how" style={{ background: 'var(--porcelain-2)' }}>
      <div className="wrap">
        <Reveal className="sec-head center">
          <span className="eyebrow">The mechanism</span>
          <h2>Here's what happens behind the scenes</h2>
          <p>You submit one requirement. Wattmatch runs the rest — sourcing, competition, vetting and contracting — end to end.</p>
        </Reveal>
        <div className="steps">
          {howItWorksSteps.map((step) => (
            <Reveal className="step" key={step.num}>
              <div className="num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
