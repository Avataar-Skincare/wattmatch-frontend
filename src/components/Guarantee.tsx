import Reveal from './Reveal';
import { guaranteeCards } from '../data/content';

export default function Guarantee() {
  return (
    <section id="guarantee" style={{ background: 'var(--porcelain-2)' }}>
      <div className="wrap">
        <Reveal className="sec-head center">
          <span className="eyebrow">The Wattmatch standard</span>
          <h2>One platform. Everything renewable. No expertise required.</h2>
          <p>
            You don't need to hire an energy manager, retain a consultant, or run your own market
            benchmarking. Wattmatch is built to be the only renewables relationship you need.
          </p>
        </Reveal>
        <div className="guarantee-grid">
          {guaranteeCards.map((card, i) => (
            <Reveal
              key={card.label}
              className={`guarantee-card${i === 1 ? ' mid' : i === 2 ? ' last' : ''}`}
            >
              <span className="g-label">{card.label}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
