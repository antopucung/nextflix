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

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

export default function Reader() {
  const { isOpen, ebook, close, navPrev, navNext, galleryUrls, galleryIndex } = useContext(ReaderContext);
  const timerRef = useRef<number | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const isImage = !!ebook?.pdfUrl && IMAGE_EXT.some((e) => ebook.pdfUrl.toLowerCase().endsWith('.' + e));

  // Helper to get the actual scrolling element inside react-pdf-viewer
  const getViewerScroller = (): HTMLElement | null => {
    const host = scrollContainerRef.current;
    if (!host) return null;
    const inner = host.querySelector('.rpv-core__inner-pages') as HTMLElement | null;
    return inner ?? host;
  };

  // Center PDF pages and ensure full-height layout on mount
  useEffect(() => {
    if (!isOpen || !ebook || isImage) return;
    const scroller = getViewerScroller();
    if (scroller) {
      scroller.style.margin = '0 auto';
      scroller.style.maxWidth = '1200px';
    }
  }, [isOpen, ebook, isImage]);

  // Attempt to detect the scroller element when opened
  useEffect(() => {
    if (!isOpen || !ebook || isImage) return;
    // Wait a tick for PdfViewer to mount
    const id = window.setTimeout(() => {
      const scroller = getViewerScroller();
      debugLog('scrollerDetected', { found: !!scroller, className: scroller?.className });
      // Try to PageFit once viewer is ready
      try { zoomApiRef.current?.zoomTo?.('PageFit'); } catch {}
    }, 0);
    return () => window.clearTimeout(id);
  }, [isOpen, ebook, isImage]);

  // drag-to-scroll state for PDF
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);

  // zoom plugin instance (must be created during render)
  const zoomApiRef = useRef<any | null>(null);
  const zoom = zoomPlugin();
  zoomApiRef.current = zoom;

  const onContainerScroll = useCallback((e: Event) => {
    if (isImage) return; // only broadcast for PDF mode
    const el = e.target as HTMLElement;
    const prevTop = (onContainerScroll as any)._prevTop ?? el.scrollTop;
    const dy = el.scrollTop - prevTop;
    (onContainerScroll as any)._prevTop = el.scrollTop;
    const isSecondRoute = typeof window !== 'undefined' && window.location.pathname === '/second/reader';
    const isPreviewRoute = typeof window !== 'undefined' && window.location.pathname === '/preview';
    if (dy !== 0 && !isSecondRoute && !isPreviewRoute) publishReaderScroll(dy, window.innerHeight);
  }, [isImage]);

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

  // Handle wheel zoom for PDF (ctrl+wheel) only; image handled on container onWheel
  useEffect(() => {
    if (!isOpen || !ebook) return;
    const onWheel = (e: WheelEvent) => {
      if (!isImage && e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) zoomApiRef.current?.zoomIn?.();
        else zoomApiRef.current?.zoomOut?.();
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
    };
  }, [isOpen, ebook, isImage]);

  // Keyboard: scroll locally; container scroll will broadcast for PDF
  useEffect(() => {
    if (!isOpen || !ebook) return;
    const onKey = (e: KeyboardEvent) => {
      if (!isImage) {
        const scroller = getViewerScroller();
        if (!scroller) return;
        if (e.key === 'ArrowDown') scroller.scrollBy({ top: 60, behavior: 'auto' });
        else if (e.key === 'ArrowUp') scroller.scrollBy({ top: -60, behavior: 'auto' });
        else if (e.key === '+') zoomApiRef.current?.zoomIn?.();
        else if (e.key === '-') zoomApiRef.current?.zoomOut?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, ebook, isImage]);

  // Keyboard navigation for images (left/right arrows)
  useEffect(() => {
    if (!isOpen || !ebook || !isImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navPrev();
      else if (e.key === 'ArrowRight') navNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, ebook, isImage, navPrev, navNext]);

  // Drag-to-scroll handlers over the viewer container (PDF mode)
  const onPointerDownPdf = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isImage) return;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    startY.current = e.clientY;
    const scroller = getViewerScroller();
    startScrollTop.current = scroller?.scrollTop || 0;
  };

  const onPointerMovePdf = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isImage) return;
    if (!isDragging) return;
    const scroller = getViewerScroller();
    if (!scroller) return;
    const dy = e.clientY - startY.current;
    const target = startScrollTop.current - dy;
    scroller.scrollTop = target;
  };

  const onPointerUpPdf = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isImage) return;
    setIsDragging(false);
    try { (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId); } catch {}
  };

  // PDF: wheel zoom on container (prevent scroll)
  const onWheelPdf: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (isImage) return;
    e.preventDefault();
    if (e.deltaY < 0) zoomApiRef.current?.zoomIn?.();
    else zoomApiRef.current?.zoomOut?.();
  };

  // PDF pinch-to-zoom and double-click zoom
  useEffect(() => {
    if (!isOpen || !ebook || isImage) return;
    let pointers: Map<number, { x: number; y: number }> = new Map();
    let lastDistance = 0;

    const withinPdf = (ev: Event): boolean => {
      const host = scrollContainerRef.current;
      return !!(host && host.contains(ev.target as Node));
    };

    const getDistance = () => {
      const pts = Array.from(pointers.values());
      if (pts.length < 2) return 0;
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      return Math.hypot(dx, dy);
    };

    const onPD = (ev: PointerEvent) => {
      if (!withinPdf(ev)) return;
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pointers.size === 2) {
        lastDistance = getDistance();
      }
    };
    const onPM = (ev: PointerEvent) => {
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
          }
        } else {
          lastDistance = dist;
        }
      }
    };
    const onPU = (ev: PointerEvent) => {
      pointers.delete(ev.pointerId);
      if (pointers.size < 2) lastDistance = 0;
    };

    window.addEventListener('pointerdown', onPD);
    window.addEventListener('pointermove', onPM);
    window.addEventListener('pointerup', onPU);
    window.addEventListener('pointercancel', onPU);
    return () => {
      window.removeEventListener('pointerdown', onPD);
      window.removeEventListener('pointermove', onPM);
      window.removeEventListener('pointerup', onPU);
      window.removeEventListener('pointercancel', onPU);
    };
  }, [isOpen, ebook, isImage]);

  const onDoubleClickPdf: React.MouseEventHandler<HTMLDivElement> = () => {
    if (isImage) return;
    zoomApiRef.current?.zoomIn?.();
  };

  // Image mode pan/zoom state
  const imgHostRef = useRef<HTMLDivElement | null>(null);
  const [imgScale, setImgScale] = useState<number>(1);
  const imgTranslate = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgTranslateState, setImgTranslateState] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const imgPanningRef = useRef<boolean>(false);
  const imgLastPointerRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const imgPinchRef = useRef<{ id1: number; id2: number; d0: number; s0: number } | null>(null);

  useEffect(() => {
    if (!isOpen || !ebook || !isImage) return;
    // reset on open for images
    setImgScale(1);
    imgTranslate.current = { x: 0, y: 0 };
    setImgTranslateState({ x: 0, y: 0 });
  }, [isOpen, ebook, isImage]);

  const onWheelImg: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!isImage) return;
    e.preventDefault();
    setImgScale((s) => {
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      const next = Math.max(1, Math.min(6, s * factor));
      return next;
    });
  };

  const onPointerDownImg: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isImage) return;
    const host = imgHostRef.current;
    if (!host) return;
    host.setPointerCapture(e.pointerId);

    if (imgPinchRef.current) return;

    if (imgLastPointerRef.current && imgLastPointerRef.current.id !== e.pointerId) {
      imgPinchRef.current = {
        id1: imgLastPointerRef.current.id,
        id2: e.pointerId,
        d0: 0,
        s0: imgScale,
      };
      imgPinchRef.current.d0 = Math.hypot(
        e.clientX - imgLastPointerRef.current.x,
        e.clientY - imgLastPointerRef.current.y
      );
      return;
    }

    imgLastPointerRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    imgPanningRef.current = true;
  };

  const onPointerMoveImg: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isImage) return;

    if (imgPinchRef.current) {
      if (!imgLastPointerRef.current) return;
      const d = Math.hypot(e.clientX - imgLastPointerRef.current.x, e.clientY - imgLastPointerRef.current.y);
      const nextScale = Math.max(1, Math.min(6, (imgPinchRef.current.s0 || 1) * (d / (imgPinchRef.current.d0 || 1))));
      setImgScale(nextScale);
      return;
    }

    if (imgPanningRef.current && imgLastPointerRef.current && imgLastPointerRef.current.id === e.pointerId && imgScale > 1) {
      const dx = e.clientX - imgLastPointerRef.current.x;
      const dy = e.clientY - imgLastPointerRef.current.y;
      imgTranslate.current = { x: imgTranslate.current.x + dx, y: imgTranslate.current.y + dy };
      setImgTranslateState({ ...imgTranslate.current });
      imgLastPointerRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
  };

  const onPointerUpImg: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isImage) return;
    const host = imgHostRef.current;
    try { host?.releasePointerCapture(e.pointerId); } catch {}

    if (imgPinchRef.current && (imgPinchRef.current.id1 === e.pointerId || imgPinchRef.current.id2 === e.pointerId)) {
      imgPinchRef.current = null;
      imgLastPointerRef.current = null;
      imgPanningRef.current = false;
      return;
    }

    if (imgLastPointerRef.current && imgLastPointerRef.current.id === e.pointerId) {
      imgLastPointerRef.current = null;
      imgPanningRef.current = false;
    }
  };

  const onDoubleClickImg: React.MouseEventHandler<HTMLDivElement> = () => {
    if (!isImage) return;
    if (imgScale > 1) {
      setImgScale(1);
      imgTranslate.current = { x: 0, y: 0 };
      setImgTranslateState({ x: 0, y: 0 });
    } else {
      setImgScale(2);
    }
  };

  if (!isOpen || !ebook) return null;

  const multipleImages = isImage && (galleryUrls?.length || 0) > 1;

  return (
    <div ref={overlayRef} className={styles.overlay}>
      <div className={styles.header}>
        <div className={styles.title}>{ebook.title}</div>
        {isImage && galleryUrls && galleryUrls.length > 1 && (
          <div className={styles.counter}>{(galleryIndex ?? 0) + 1} / {galleryUrls.length}</div>
        )}
        <button className={styles.close} onClick={close}>×</button>
      </div>
      <div className={styles.window}>
        {!isImage && (
          <div className={styles.thumbs}>
            <div className={styles.thumbTitle}>Halaman</div>
          </div>
        )}
        {!isImage ? (
          <div
            ref={scrollContainerRef}
            className={`${styles.content} ${isDragging ? styles.dragging : ''}`}
            onPointerDown={onPointerDownPdf}
            onPointerMove={onPointerMovePdf}
            onPointerUp={onPointerUpPdf}
            onPointerLeave={onPointerUpPdf}
            onDoubleClick={onDoubleClickPdf}
            onWheel={onWheelPdf}
            onScrollCapture={(e) => onContainerScroll(e.nativeEvent)}
          >
            <PdfViewer fileUrl={ebook.pdfUrl} plugins={[zoom]} />
          </div>
        ) : (
          <div className={styles.contentImage}>
            {multipleImages && (
              <button className={`${styles.navButton} ${styles.navLeft}`} onClick={navPrev} aria-label='Previous image'>‹</button>
            )}
            <div
              ref={imgHostRef}
              className={styles.imageHost}
              onWheel={onWheelImg}
              onPointerDown={onPointerDownImg}
              onPointerMove={onPointerMoveImg}
              onPointerUp={onPointerUpImg}
              onPointerCancel={onPointerUpImg}
              onDoubleClick={onDoubleClickImg}
            >
              <img
                src={ebook.pdfUrl}
                alt={ebook.title}
                className={styles.imageElement}
                draggable={false}
                style={{ transform: `translate3d(${imgTranslateState.x}px, ${imgTranslateState.y}px, 0) scale(${imgScale})` }}
              />
            </div>
            {multipleImages && (
              <button className={`${styles.navButton} ${styles.navRight}`} onClick={navNext} aria-label='Next image'>›</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 