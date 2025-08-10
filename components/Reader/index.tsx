/* eslint-disable @next/next/no-img-element */
import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import styles from '../../styles/Reader.module.scss';
import { ReaderContext } from '../../context/ReaderContext';
import { publishReaderScroll } from '../../utils/heroSync';
import dynamic from 'next/dynamic';
import { zoomPlugin } from '@react-pdf-viewer/zoom';

const PdfViewer = dynamic(() => import('./PdfViewer'), { ssr: false });

const IDLE_CLOSE_MS = 30000; // 30 seconds
const debugLog = (...args: any[]) => console.log('[ReaderSwipe]', ...args);

export default function Reader() {
  const { isOpen, ebook, close } = useContext(ReaderContext);
  const timerRef = useRef<number | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Helper to get the actual scrolling element inside react-pdf-viewer
  const getViewerScroller = (): HTMLElement | null => {
    const host = scrollContainerRef.current;
    if (!host) return null;
    const inner = host.querySelector('.rpv-core__inner-pages') as HTMLElement | null;
    return inner ?? host;
  };

  // Center PDF pages and ensure full-height layout on mount
  useEffect(() => {
    if (!isOpen) return;
    const scroller = getViewerScroller();
    if (scroller) {
      scroller.style.margin = '0 auto';
      scroller.style.maxWidth = '1200px';
    }
  }, [isOpen]);

  // Attempt to detect the scroller element when opened
  useEffect(() => {
    if (!isOpen) return;
    // Wait a tick for PdfViewer to mount
    const id = window.setTimeout(() => {
      const scroller = getViewerScroller();
      debugLog('scrollerDetected', { found: !!scroller, className: scroller?.className });
      // Try to PageFit once viewer is ready
      try { zoomApiRef.current?.zoomTo?.('PageFit'); } catch {}
    }, 0);
    return () => window.clearTimeout(id);
  }, [isOpen, ebook]);

  // drag-to-scroll state
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);

  // zoom plugin instance (must be created during render)
  const zoomApiRef = useRef<any | null>(null);
  const zoom = zoomPlugin();
  zoomApiRef.current = zoom;

  const onContainerScroll = useCallback((e: Event) => {
    const tgt = e.target as HTMLElement;
    debugLog('scroll', { targetClass: tgt?.className, scrollTop: tgt?.scrollTop });
    const el = e.target as HTMLElement;
    const prevTop = (onContainerScroll as any)._prevTop ?? el.scrollTop;
    const dy = el.scrollTop - prevTop;
    (onContainerScroll as any)._prevTop = el.scrollTop;
    const isSecondRoute = typeof window !== 'undefined' && window.location.pathname === '/second/reader';
    const isPreviewRoute = typeof window !== 'undefined' && window.location.pathname === '/preview';
    if (dy !== 0 && !isSecondRoute && !isPreviewRoute) publishReaderScroll(dy, window.innerHeight);
  }, []);

  // Inactivity auto-close
  useEffect(() => {
    if (!isOpen || !ebook) return;

    const resetTimer = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        close();
      }, IDLE_CLOSE_MS) as unknown as number;
    };

    resetTimer();
    const onActivity = () => resetTimer();
    window.addEventListener('pointerdown', onActivity, { passive: true });
    window.addEventListener('pointermove', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity);
    window.addEventListener('wheel', onActivity, { passive: true });

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('pointermove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('wheel', onActivity);
    };
  }, [isOpen, ebook, close]);

  // Handle wheel for zoom only (ctrl+wheel). Do not publish here; let scroll event handle sync.
  useEffect(() => {
    if (!isOpen || !ebook) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        debugLog('wheelZoom', { deltaY: e.deltaY });
        if (e.deltaY < 0) zoomApiRef.current?.zoomIn?.();
        else zoomApiRef.current?.zoomOut?.();
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
    };
  }, [isOpen, ebook]);

  // Keyboard: scroll locally; container scroll will broadcast
  useEffect(() => {
    if (!isOpen || !ebook) return;
    const onKey = (e: KeyboardEvent) => {
      const scroller = getViewerScroller();
      if (!scroller) return;
      if (e.key === 'ArrowDown') scroller.scrollBy({ top: 60, behavior: 'auto' });
      else if (e.key === 'ArrowUp') scroller.scrollBy({ top: -60, behavior: 'auto' });
      else if (e.key === '+') zoomApiRef.current?.zoomIn?.();
      else if (e.key === '-') zoomApiRef.current?.zoomOut?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, ebook]);

  // Drag-to-scroll handlers over the viewer container
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    startY.current = e.clientY;
    const scroller = getViewerScroller();
    startScrollTop.current = scroller?.scrollTop || 0;
    const inner = scrollContainerRef.current?.querySelector('.rpv-core__inner-pages') as HTMLElement | null;
    debugLog('pointerDown', {
      button: e.button,
      targetClass: (e.target as HTMLElement)?.className,
      scrollerFound: !!scroller,
      scrollerClass: scroller?.className,
      insideInner: !!inner && inner.contains(e.target as Node),
      startY: startY.current,
      startScrollTop: startScrollTop.current,
    });

    // double-tap to zoom in
    const now = Date.now();
    const last = (onPointerDown as any)._lastTap || 0;
    if (now - last < 300) {
      zoomApiRef.current?.zoomIn?.();
    }
    (onPointerDown as any)._lastTap = now;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const scroller = getViewerScroller();
    if (!scroller) return;
    const dy = e.clientY - startY.current;
    const target = startScrollTop.current - dy;
    scroller.scrollTop = target;
    debugLog('pointerMoveDrag', { dy, targetScrollTop: target });
    // Do not publish here; the container scroll event will broadcast
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try { (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId); } catch {}
    debugLog('pointerUp', { wasDragging: true });
  };

  // Pinch-to-zoom via two pointers
  useEffect(() => {
    if (!isOpen) return;
    let pointers: Map<number, { x: number; y: number }> = new Map();
    let lastDistance = 0;

    const getDistance = () => {
      const pts = Array.from(pointers.values());
      if (pts.length < 2) return 0;
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      return Math.hypot(dx, dy);
    };

    const onPointerDownWin = (ev: PointerEvent) => {
      if (!(scrollContainerRef.current && scrollContainerRef.current.contains(ev.target as Node))) return;
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pointers.size === 2) {
        lastDistance = getDistance();
        debugLog('pinchStart');
      }
    };
    const onPointerMoveWin = (ev: PointerEvent) => {
      if (!pointers.has(ev.pointerId)) return;
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pointers.size === 2) {
        const dist = getDistance();
        if (lastDistance > 0) {
          const delta = dist - lastDistance;
          if (Math.abs(delta) > 8) {
            if (delta > 0) zoomApiRef.current?.zoomIn?.();
            else zoomApiRef.current?.zoomOut?.();
            lastDistance = dist;
            debugLog('pinchZoom', { delta });
          }
        } else {
          lastDistance = dist;
        }
      }
    };
    const onPointerUpWin = (ev: PointerEvent) => {
      pointers.delete(ev.pointerId);
      if (pointers.size < 2) lastDistance = 0;
    };

    window.addEventListener('pointerdown', onPointerDownWin);
    window.addEventListener('pointermove', onPointerMoveWin);
    window.addEventListener('pointerup', onPointerUpWin);
    window.addEventListener('pointercancel', onPointerUpWin);
    return () => {
      window.removeEventListener('pointerdown', onPointerDownWin);
      window.removeEventListener('pointermove', onPointerMoveWin);
      window.removeEventListener('pointerup', onPointerUpWin);
      window.removeEventListener('pointercancel', onPointerUpWin);
    };
  }, [isOpen]);

  if (!isOpen || !ebook) return null;

  return (
    <div ref={overlayRef} className={styles.overlay}>
      <div className={styles.header}>
        <div className={styles.title}>{ebook.title}</div>
        <button className={styles.close} onClick={close}>×</button>
      </div>
      <div className={styles.window}>
        <div className={styles.thumbs}>
          <div className={styles.thumbTitle}>Halaman</div>
        </div>
        <div
          ref={scrollContainerRef}
          className={`${styles.content} ${isDragging ? styles.dragging : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onScrollCapture={(e) => onContainerScroll(e.nativeEvent)}
        >
          <PdfViewer fileUrl={ebook.pdfUrl} plugins={[zoom]} />
        </div>
      </div>
    </div>
  );
} 