import React, { useEffect, useRef, useState } from 'react';
import styles from '../app/page.module.css';

export default function ScrollProgress({ size = 56, radius = 20, stroke = 4 }) {
  const circleRef = useRef(null);
  const labelRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const circle = circleRef.current;
    const label = labelRef.current;
    if (!circle) return;

    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`;

    let ticking = false;

    function update() {
      const scrollY = window.scrollY || window.pageYOffset;
      const doc = document.documentElement;
      const scrollHeight = Math.max(doc.scrollHeight, document.body.scrollHeight);
      const winH = window.innerHeight;
      const progress = Math.max(0, Math.min(1, scrollY / (scrollHeight - winH)));
      const offset = circumference - progress * circumference;
      // apply offset
      circle.style.strokeDashoffset = offset;
      if (label) label.textContent = `${Math.round(progress * 100)}%`;
      // visibility: hide when near top
      setVisible(progress > 0.02);
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    // initial update
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [radius]);

  function handleClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <button
      className={`${styles.scrollProgress} ${visible ? styles.visible : ''}`}
      onClick={handleClick}
      aria-label="Scroll progress: click to return to top"
    >
      <svg width={size} height={size} viewBox="0 0 48 48" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="scrollGrad" x1="0" x2="1">
            <stop offset="0" stopColor="#3B82F6" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} fill="none" />
        <circle
          ref={circleRef}
          cx="24"
          cy="24"
          r={radius}
          stroke="url(#scrollGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          transform="rotate(-90 24 24)"
        />
      </svg>
      <span className={styles.scrollPercent} ref={labelRef}>0%</span>
    </button>
  );
}


