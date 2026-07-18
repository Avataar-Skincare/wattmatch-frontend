import Reveal from './Reveal';
import { withoutWattmatch, withWattmatch } from '../data/content';

export default function Replace() {
  return (
    <section id="replace" style={{ background: 'var(--porcelain)' }}>
      <div className="wrap">
        <Reveal className="sec-head center">
          <span className="eyebrow">Why teams choose Wattmatch</span>
          <h2>One partner, instead of another team to manage</h2>
          <p>Going solar usually means building capability you'll only ever use once. Wattmatch replaces all of it.</p>
        </Reveal>
        <Reveal className="compare-grid">
          <div className="compare-col without">
            <span className="compare-head">Without Wattmatch</span>
            <ul>
              {withoutWattmatch.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="compare-arrow" aria-hidden="true">→</div>
          <div className="compare-col with">
            <span className="compare-head">With Wattmatch</span>
            <ul>
              {withWattmatch.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
