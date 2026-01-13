import React, { useRef, useEffect, useState } from 'react';
import styles from '../app/page.module.css';

// Continuous linear carousel: constant speed (pixels per second)
export default function TestimonialsCarousel({ items = [], speedPxPerSec = 60 }) {
  const trackRef = useRef(null);
  const containerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // render items duplicated once for seamless wrap
  const renderItems = items.concat(items);

  useEffect(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container || items.length === 0) return;

    let rafId = null;
    let lastTime = performance.now();
    let offset = 0;

    // compute width of one set (original items)
    function computeSingleWidth() {
      let total = 0;
      const children = track.children;
      const gap = parseFloat(getComputedStyle(track).gap) || 16;
      for (let i = 0; i < children.length / 2; i++) {
        total += children[i].offsetWidth + gap;
      }
      return total;
    }

    let singleWidth = computeSingleWidth();

    // handle resize: recompute widths
    let resizeObserver = new ResizeObserver(() => {
      singleWidth = computeSingleWidth();
    });
    resizeObserver.observe(container);
    // pause on hovering individual cards or focusing them (per-card pause)
    const cardSelector = `.${styles.testimonialCard}`;
    function onTrackMouseOver(e) {
      if (e.target.closest(cardSelector)) setIsPaused(true);
    }
    function onTrackMouseOut(e) {
      // if moving outside any card, resume
      const related = e.relatedTarget;
      if (!related || !related.closest || !related.closest(cardSelector)) {
        setIsPaused(false);
      }
    }
    function onTrackFocusIn(e) {
      if (e.target.closest(cardSelector)) setIsPaused(true);
    }
    function onTrackFocusOut(e) {
      const related = e.relatedTarget;
      if (!related || !related.closest || !related.closest(cardSelector)) {
        setIsPaused(false);
      }
    }
    track.addEventListener('mouseover', onTrackMouseOver);
    track.addEventListener('mouseout', onTrackMouseOut);
    track.addEventListener('focusin', onTrackFocusIn);
    track.addEventListener('focusout', onTrackFocusOut);

    function step(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      if (!isPaused) {
        offset -= speedPxPerSec * dt;
        // wrap offset when full set scrolled
        if (Math.abs(offset) >= singleWidth) {
          offset += singleWidth;
        }
        track.style.transform = `translateX(${offset}px)`;
      }
      rafId = requestAnimationFrame(step);
    }

    // initialize transform
    track.style.willChange = 'transform';
    track.style.transform = `translateX(0px)`;
    lastTime = performance.now();
    rafId = requestAnimationFrame(step);

    // touch: pause on touchstart, resume on end
    function touchStart() { setIsPaused(true); }
    function touchEnd() { setIsPaused(false); }
    track.addEventListener('touchstart', touchStart, { passive: true });
    track.addEventListener('touchend', touchEnd);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      track.removeEventListener('mouseover', onTrackMouseOver);
      track.removeEventListener('mouseout', onTrackMouseOut);
      track.removeEventListener('focusin', onTrackFocusIn);
      track.removeEventListener('focusout', onTrackFocusOut);
      track.removeEventListener('touchstart', touchStart);
      track.removeEventListener('touchend', touchEnd);
    };
  }, [items, isPaused, speedPxPerSec]);

  return (
    <div ref={containerRef} className={styles.testimonialsCarousel} role="region" aria-roledescription="carousel" aria-label="Testimonials">
      <div ref={trackRef} className={styles.carouselTrack}>
        {renderItems.map((t, idx) => (
          <div key={idx} className={styles.testimonialCard} tabIndex={-1}>
            <p className={styles.testimonialQuote}>&ldquo;{t.quote}&rdquo;</p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.testimonialAvatar}>
                <img src={t.avatar} alt={t.author} width="56" height="56" />
              </div>
              <div>
                <div className={styles.testimonialName}>{t.author}</div>
                <div className={styles.testimonialRole}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


