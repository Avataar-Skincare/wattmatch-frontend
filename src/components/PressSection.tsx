import Reveal from './Reveal';
import LaunchCarousel from './LaunchCarousel';
import { inaugDayPhotos, launchCaptionMeta } from '../data/content';

export default function PressSection() {
  return (
    <section className="press-section">
      <div className="wrap">
        <Reveal className="sec-head center">
          <span className="eyebrow">At the CII conference</span>
          <h2>More moments from the stall</h2>
        </Reveal>
        <LaunchCarousel photos={inaugDayPhotos} captionMeta={launchCaptionMeta} size="large" />
      </div>
    </section>
  );
}
