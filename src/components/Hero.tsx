import LaunchCarousel from './LaunchCarousel';
import { launchPhotos, launchCaptionMeta } from '../data/content';

export default function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-inner">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">The full-service renewables partner for C&amp;I</span>
            <h1>Two sides of energy.<br />One trusted <em>match</em>.</h1>
            <p className="lead">
              Wattmatch sources, vets, negotiates, contracts and monitors your entire renewable energy
              transition: the best generator, the best terms, the best quality, so you never need an
              in-house energy team, a consultant, or your own benchmarking exercise.
            </p>
            <div className="hero-ctas">
              <a href="#for-ci" className="btn btn-solar">I buy power <span className="btn-arrow">→</span></a>
              <a href="#for-generators" className="btn btn-outline">I generate power <span className="btn-arrow">→</span></a>
            </div>
          </div>
          <div className="hero-photo-col">
            <LaunchCarousel photos={launchPhotos} captionMeta={launchCaptionMeta} />
          </div>
        </div>
      </div>
    </section>
  );
}
