import React, { useEffect, useRef, useState } from 'react';

type Mode = 'pending' | 'vertical' | null;

export default function PageDragScroll(): React.ReactElement | null {
  const modeRef = useRef<Mode>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startScrollYRef = useRef(0);
  const startedInNoDrag = useRef(false);
  const [enabled] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      startedInNoDrag.current = !!(target && target.closest('[data-nodrag]'));
      modeRef.current = 'pending';
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      startScrollYRef.current = window.scrollY;
      // eslint-disable-next-line no-console
      console.log('[PageDrag] pointerdown', { x: e.clientX, y: e.clientY, inNoDrag: startedInNoDrag.current });
    };

    const onPointerMove = (e: PointerEvent) => {
      const mode = modeRef.current;
      if (!mode) return; // inactive or delegated
      const dx = e.clientX - startXRef.current;
      const dy = e.clientY - startYRef.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const THRESHOLD = 8;
      const BIAS = 4;

      if (mode === 'pending') {
        if (absDy > THRESHOLD && absDy > absDx + BIAS) {
          // vertical wins everywhere, even inside no-drag areas
          modeRef.current = 'vertical';
          document.body.style.cursor = 'grabbing';
          (document.body.style as any).userSelect = 'none';
          (document.body.style as any).webkitUserSelect = 'none';
          // eslint-disable-next-line no-console
          console.log('[PageDrag] mode -> vertical');
        } else if (absDx > THRESHOLD && absDx > absDy + BIAS) {
          // horizontal gesture: if started in no-drag (carousel), delegate to it
          if (startedInNoDrag.current) {
            modeRef.current = null;
            // eslint-disable-next-line no-console
            console.log('[PageDrag] delegate horizontal to scroller');
            return;
          } else {
            // outside carousels we still let the native horizontal do nothing
            modeRef.current = null;
            return;
          }
        } else {
          // eslint-disable-next-line no-console
          console.log('[PageDrag] pending move', { dx, dy, absDx, absDy });
          return;
        }
      }

      if (modeRef.current === 'vertical') {
        window.scrollTo({ top: startScrollYRef.current - dy, behavior: 'auto' });
        e.preventDefault();
        // eslint-disable-next-line no-console
        console.log('[PageDrag] drag vertical', { dy, top: startScrollYRef.current - dy });
      }
    };

    const endDrag = () => {
      if (!modeRef.current) return;
      modeRef.current = null;
      startedInNoDrag.current = false;
      document.body.style.cursor = '';
      (document.body.style as any).userSelect = '';
      (document.body.style as any).webkitUserSelect = '';
      // eslint-disable-next-line no-console
      console.log('[PageDrag] pointerend');
    };

    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', endDrag, { passive: true });
    document.addEventListener('pointercancel', endDrag, { passive: true });

    return () => {
      document.removeEventListener('pointerdown', onPointerDown as any);
      document.removeEventListener('pointermove', onPointerMove as any);
      document.removeEventListener('pointerup', endDrag as any);
      document.removeEventListener('pointercancel', endDrag as any);
    };
  }, [enabled]);

  return null;
} 