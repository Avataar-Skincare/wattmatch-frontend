export default function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-inner">
        <span className="eyebrow">The full-service renewables partner for C&amp;I</span>
        <h1>Run your business.<br />We'll run your <em>renewables</em>.</h1>
        <p className="lead">
          Wattmatch sources, vets, negotiates, contracts and monitors your entire renewable energy
          transition — the best generator, the best terms, the best quality — so you never need an
          in-house energy team, a consultant, or your own benchmarking exercise.
        </p>
        <div className="hero-ctas">
          <a href="#for-ci" className="btn btn-solar">I buy power <span className="btn-arrow">→</span></a>
          <a href="#for-generators" className="btn btn-outline">I generate power <span className="btn-arrow">→</span></a>
        </div>

        <div className="circuit" aria-hidden="true">
          <div className="node">
            <span className="eyebrow">Demand</span>
            <strong>C&amp;I Buyer</strong>
          </div>
          <div className="trace left"></div>
          <div className="node match">
            <span className="eyebrow">Managed by</span>
            <strong>Wattmatch</strong>
          </div>
          <div className="trace right"></div>
          <div className="node">
            <span className="eyebrow">Supply</span>
            <strong>Solar Generator</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
