import { useEffect, useState } from 'react';
import type { LaunchPhoto } from '../data/content';

const SLIDE_INTERVAL_MS = 4000;
// Fixed frame height for any photo set with mixed aspect ratios, so the carousel doesn't jump
// taller/shorter as it cycles between a portrait and a landscape shot — width is derived from
// each photo's own ratio instead, so a landscape photo simply renders wider at the same height
// rather than getting force-cropped to match. Kept modest (rather than matching the tallest
// portrait's natural size) now that most of this carousel's photos are landscape — a taller frame
// was pushing the caption text below the fold on shorter viewports.
const MIXED_RATIO_FRAME_HEIGHT = 440;

interface LaunchCarouselProps {
  photos: LaunchPhoto[];
  captionMeta: string;
  tag?: string;
  /** 'large' widens the frame and bumps up the caption text — for a standalone section where the
   *  carousel isn't sharing a narrow hero grid column. Default matches the original Hero sizing. */
  size?: 'default' | 'large';
}

export default function LaunchCarousel({
  photos: launchPhotos,
  captionMeta: launchCaptionMeta,
  tag = 'Industry recognition',
  size = 'default',
}: LaunchCarouselProps) {
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
    <div className={`launch-carousel${size === 'large' ? ' launch-carousel-lg' : ''}`}>
      <div className="launch-carousel-frame">
        {/* Height stays fixed; width (via aspect-ratio) adapts per photo — a set with mixed
            portrait/landscape shots would look wrong force-cropped into one fixed frame, and
            would visibly jump taller/shorter each slide if width were the fixed axis instead.
            Photos that don't specify aspectRatio (e.g. launchPhotos, which are all the same 2:3
            shape) keep the default fixed-width square frame from the CSS. */}
        <div
          className="launch-carousel-photo"
          style={
            photo.aspectRatio
              ? {
                  width: 'auto',
                  height: MIXED_RATIO_FRAME_HEIGHT,
                  aspectRatio: photo.aspectRatio,
                  // .launch-carousel itself caps out at 420px (sized for the portrait shape /
                  // Hero's grid column) — flexShrink:0 stops the flex layout from squeezing a
                  // wider landscape photo back down to fit that column; maxWidth is a viewport-
                  // relative safety net instead of a container-relative one, precisely so it isn't
                  // capped by that same narrow ancestor.
                  flexShrink: 0,
                  maxWidth: '92vw',
                }
              : undefined
          }
        >
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
      <div className="launch-carousel-caption">
        <span className="launch-carousel-tag">{tag}</span>
        <p className="launch-carousel-caption-text">{photo.caption}</p>
        <p className="launch-carousel-meta">{launchCaptionMeta}</p>
      </div>
    </div>
  );
}
