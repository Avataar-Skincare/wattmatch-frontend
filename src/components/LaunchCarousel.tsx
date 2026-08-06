import { useEffect, useState } from 'react';
import { launchPhotos } from '../data/content';

const SLIDE_INTERVAL_MS = 4000;

export default function LaunchCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Preload every photo up front so the browser already has it cached by the
    // time autoplay swaps to it — otherwise the fade-in has to wait on the network.
    launchPhotos.forEach((photo) => {
      const img = new Image();
      img.src = photo.src;
    });
  }, []);

  useEffect(() => {
    if (launchPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % launchPhotos.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  if (launchPhotos.length === 0) return null;

  const showDots = launchPhotos.length > 1;
  const photo = launchPhotos[index];
  const rotate = photo.rotate ?? 0;
  const swapped = rotate === 90 || rotate === 270;
  // .launch-carousel-photo is a fixed square frame. A 90/270 correction means the
  // source image is really landscape, so the pre-rotation crop box needs the inverse
  // aspect — swap width/height before rotating, so object-fit:cover crops correctly
  // and the rotated result still fills the frame.
  const rotatorStyle = swapped
    ? { top: '50%', left: '50%', width: '100%', height: '100%', transform: `translate(-50%, -50%) rotate(${rotate}deg)` }
    : { transform: `rotate(${rotate}deg)` };

  return (
    <div className="launch-carousel">
      <div className="launch-carousel-frame">
        <div className="launch-carousel-photo">
          {/* key={index} forces a remount on every slide change, so only one photo is ever
              in the DOM at once — no double-exposure — while still fading in smoothly. */}
          <div key={index} className="launch-carousel-slide">
            <div className="launch-carousel-photo-rotator" style={rotatorStyle}>
              <img src={photo.src} alt={photo.caption} />
            </div>
          </div>
        </div>
      </div>
      {showDots && (
        <div className="launch-carousel-dots">
          {launchPhotos.map((_, i) => (
            <button
              type="button"
              key={i}
              className={i === index ? 'on' : ''}
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
