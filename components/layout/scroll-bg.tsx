'use client';

import { useEffect } from 'react';

/**
 * Drives the scroll-reactive page gradient (see globals.css body::before/
 * ::after) by writing a 0→1 `--scroll-progress` custom property as the
 * page scrolls. Renders nothing.
 */
export function ScrollBg() {
  useEffect(() => {
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(4));
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return null;
}
