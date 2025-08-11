/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import axios from 'axios';
import styles from '../../styles/Explorer.module.scss';
import type { ExplorerItem } from '../../pages/api/arsip2';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { ReaderContext } from '../../context/ReaderContext';
import type { Ebook } from '../../types';

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

type Preview =
  | { kind: 'image'; url: string; name: string }
  | { kind: 'pdf'; url: string; name: string }
  | null;

export default function Explorer(): React.ReactElement {
  const [cwd, setCwd] = useState<string>('');
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [items, setItems] = useState<ExplorerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview>(null);
  const { open: openReader, openWithGallery } = useContext(ReaderContext);

  // image zoom state
  const zoomHostRef = useRef<HTMLDivElement | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanningRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const pinchRef = useRef<{ id1: number; id2: number; d0: number; s0: number } | null>(null);

  // pdf drag-to-scroll state
  const pdfHostRef = useRef<HTMLDivElement | null>(null);
  const pdfDraggingRef = useRef<boolean>(false);
  const pdfStartYRef = useRef<number>(0);
  const pdfStartScrollRef = useRef<number>(0);
  const pdfScrollerRef = useRef<HTMLElement | null>(null);

  // grid drag-to-scroll (vertical page scroll)
  const gridRef = useRef<HTMLDivElement | null>(null);
  const gridDraggingRef = useRef<boolean>(false);
  const gridStartYRef = useRef<number>(0);
  const gridStartScrollRef = useRef<number>(0);
  const gridDidMoveRef = useRef<boolean>(false);
  const suppressClickRef = useRef<boolean>(false);

  const fetchPath = useCallback(async (rel: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/arsip2', { params: { path: rel } });
      if (res.data.type === 'Success') {
        setCwd(res.data.cwd);
        setBreadcrumb(res.data.breadcrumb);
        setItems(res.data.items);
      } else {
        setError(res.data.error || 'Unknown error');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPath('');
  }, [fetchPath]);

  const pathParts = useMemo(() => {
    const parts = [''];
    let acc = '';
    for (const p of breadcrumb) {
      acc = acc ? `${acc}/${p}` : p;
      parts.push(acc);
    }
    return parts; // aligned indices: parts[i] is path to breadcrumb[i-1]
  }, [breadcrumb]);

  const onOpen = (item: ExplorerItem) => {
    if (suppressClickRef.current) return; // ignore clicks after drag
    if (item.type === 'dir') {
      fetchPath(item.relPath);
      return;
    }
    const ext = (item.ext || '').toLowerCase();
    if (ext === 'pdf') {
      const title = item.name.replace(/\.[^/.]+$/, '') || 'Arsip';
      const ebook: Ebook = {
        id: Date.now(),
        title,
        overview: '',
        cover: '',
        banner: '',
        rating: 0,
        genre: [],
        pdfUrl: item.url || ''
      };
      openReader(ebook);
      setPreview(null);
      // reset any prior pdf drag state
      pdfDraggingRef.current = false;
      pdfStartYRef.current = 0;
      pdfStartScrollRef.current = 0;
      pdfScrollerRef.current = null;
      return;
    } else if (IMAGE_EXT.includes(ext)) {
      const title = item.name.replace(/\.[^/.]+$/, '') || 'Gambar';
      const ebook: Ebook = {
        id: Date.now(),
        title,
        overview: '',
        cover: item.url || '',
        banner: item.url || '',
        rating: 0,
        genre: [],
        pdfUrl: item.url || ''
      };
      // collect gallery images from current listing order
      const imageUrls = items.filter(it => it.type === 'file' && IMAGE_EXT.includes((it.ext || '').toLowerCase())).map(it => it.url || '').filter(Boolean);
      const currentIndex = imageUrls.findIndex(u => u === item.url);
      if (imageUrls.length > 0 && currentIndex >= 0) {
        // Use global Reader with gallery
        openWithGallery(ebook, imageUrls, currentIndex);
      } else {
        openReader(ebook);
      }
      setPreview(null);
      // reset image state
      setZoomScale(1);
      setTranslate({ x: 0, y: 0 });
      isPanningRef.current = false;
      lastPointerRef.current = null;
      pinchRef.current = null;
      return;
    } else {
      window.open(item.url!, '_blank', 'noopener');
    }
  };

  const onCrumb = (index: number) => {
    const rel = pathParts[index];
    fetchPath(rel);
  };

  const folderHueStyle = (mtime?: number): React.CSSProperties => {
    const ms = typeof mtime === 'number' ? mtime : 0;
    const hue = (ms / (1000 * 60 * 60 * 24)) % 360; // days mod 360
    const deg = Math.floor(hue);
    return { filter: `hue-rotate(${deg}deg) saturate(1.05)` };
  };

  const crumbStyle = (index: number): React.CSSProperties => {
    // root index = 0 (DataFinalArsip), segments start at 1
    const hue = (index * 42) % 360; // pleasant varied hues
    return { color: `hsl(${hue}, 70%, 70%)` };
  };

  // Image zoom/pan handlers (kept for the custom modal fallback, not used when opening via Reader)
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const onWheelZoom: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!preview || preview.kind !== 'image') return;
    const delta = e.deltaY;
    const factor = delta > 0 ? 0.92 : 1.08;
    const next = clamp(zoomScale * factor, 1, 6);
    if (next === zoomScale) return;
    setZoomScale(next);
  };

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!preview || preview.kind !== 'image') return;
    const host = zoomHostRef.current;
    if (!host) return;
    host.setPointerCapture(e.pointerId);

    if (pinchRef.current) {
      return;
    }

    if (lastPointerRef.current && lastPointerRef.current.id !== e.pointerId) {
      pinchRef.current = {
        id1: lastPointerRef.current.id,
        id2: e.pointerId,
        d0: 0,
        s0: zoomScale,
      };
      pinchRef.current.d0 = Math.hypot(
        e.clientX - lastPointerRef.current.x,
        e.clientY - lastPointerRef.current.y
      );
      return;
    }

    lastPointerRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    isPanningRef.current = true;
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!preview || preview.kind !== 'image') return;

    if (pinchRef.current) {
      if (!lastPointerRef.current) return;
      const d = Math.hypot(e.clientX - lastPointerRef.current.x, e.clientY - lastPointerRef.current.y);
      const nextScale = clamp((pinchRef.current.s0 || 1) * (d / (pinchRef.current.d0 || 1)), 1, 6);
      setZoomScale(nextScale);
      return;
    }

    if (isPanningRef.current && lastPointerRef.current && lastPointerRef.current.id === e.pointerId && zoomScale > 1) {
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
      lastPointerRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!preview || preview.kind !== 'image') return;
    const host = zoomHostRef.current;
    try { host?.releasePointerCapture(e.pointerId); } catch {}

    if (pinchRef.current && (pinchRef.current.id1 === e.pointerId || pinchRef.current.id2 === e.pointerId)) {
      pinchRef.current = null;
      lastPointerRef.current = null;
      isPanningRef.current = false;
      return;
    }

    if (lastPointerRef.current && lastPointerRef.current.id === e.pointerId) {
      lastPointerRef.current = null;
      isPanningRef.current = false;
    }
  };

  const onDoubleClick: React.MouseEventHandler<HTMLDivElement> = () => {
    if (!preview || preview.kind !== 'image') return;
    if (zoomScale > 1) {
      setZoomScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      setZoomScale(2);
    }
  };

  // PDF drag-to-scroll handlers (kept as fallback for non-Reader use cases)
  const findScrollable = (root: HTMLElement): HTMLElement | null => {
    if (root.scrollHeight > root.clientHeight + 1) return root;
    const nodes = root.querySelectorAll<HTMLElement>('*');
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const style = window.getComputedStyle(n);
      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && n.scrollHeight > n.clientHeight + 1) {
        return n;
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.scrollHeight > n.clientHeight + 1) return n;
    }
    return null;
  };

  const ensurePdfScroller = () => {
    if (pdfScrollerRef.current) return pdfScrollerRef.current;
    const host = pdfHostRef.current;
    if (!host) return null;
    let scroller = host.querySelector('.rpv-core__inner-pages') as HTMLElement | null;
    if (!scroller) scroller = host.querySelector('.rpv-core__viewer') as HTMLElement | null;
    if (!scroller) scroller = findScrollable(host);
    pdfScrollerRef.current = scroller;
    return scroller;
  };

  const onPdfPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!preview || preview.kind !== 'pdf') return;
    if (e.button !== 0) return; // left-click only
    e.preventDefault();
    const overlay = e.currentTarget as HTMLDivElement;
    overlay.setPointerCapture(e.pointerId);
    const scroller = ensurePdfScroller();
    if (!scroller) return;
    pdfDraggingRef.current = true;
    pdfStartYRef.current = e.clientY;
    pdfStartScrollRef.current = scroller.scrollTop;
  };

  const onPdfPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!preview || preview.kind !== 'pdf') return;
    if (!pdfDraggingRef.current) return;
    e.preventDefault();
    const scroller = ensurePdfScroller();
    if (!scroller) return;
    const dy = e.clientY - pdfStartYRef.current;
    scroller.scrollTop = pdfStartScrollRef.current - dy; // drag to scroll
  };

  const onPdfPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!preview || preview.kind !== 'pdf') return;
    try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch {}
    pdfDraggingRef.current = false;
  };

  // Grid drag-to-scroll handlers (scroll page vertically)
  const getPageScroller = (): HTMLElement => {
    return document.scrollingElement || document.documentElement || document.body;
  };

  const onGridPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.button !== 0) return; // left button only
    suppressClickRef.current = false;
    gridDidMoveRef.current = false;
    gridDraggingRef.current = true;
    gridStartYRef.current = e.clientY;
    gridStartScrollRef.current = getPageScroller().scrollTop;
  };

  const onGridPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!gridDraggingRef.current) return;
    const dy = e.clientY - gridStartYRef.current;
    if (Math.abs(dy) > 6) {
      gridDidMoveRef.current = true;
      suppressClickRef.current = true;
    }
    const scroller = getPageScroller();
    scroller.scrollTop = gridStartScrollRef.current - dy;
  };

  const onGridPointerUp: React.PointerEventHandler<HTMLDivElement> = (_e) => {
    gridDraggingRef.current = false;
    // If a drag occurred, keep suppression just long enough to swallow the ensuing click
    if (gridDidMoveRef.current) {
      window.setTimeout(() => { suppressClickRef.current = false; }, 100);
    } else {
      suppressClickRef.current = false;
    }
    gridDidMoveRef.current = false;
  };

  return (
    <div className={styles.explorer}>
      <div className={styles.toolbar}>
        <div className={styles.breadcrumbs}>
          <span className={`${styles.crumb} ${styles.crumbRoot}`} style={crumbStyle(0)} onClick={() => onCrumb(0)}>DataFinalArsip</span>
          {breadcrumb.map((part, i) => (
            <span key={i} className={styles.crumbWrap}>
              <span className={styles.sep}>/</span>
              <span className={styles.crumb} style={crumbStyle(i + 1)} onClick={() => onCrumb(i + 1)}>
                {part}
              </span>
              {i === breadcrumb.length - 1 && <span className={styles.sep}>/</span>}
            </span>
          ))}
        </div>
      </div>

      {loading && <div className={styles.center}>Loading…</div>}
      {error && <div className={styles.center} style={{ color: '#f66' }}>{error}</div>}

      {!loading && !error && (
        <div
          ref={gridRef}
          className={`${styles.grid} ${gridDraggingRef.current ? styles.dragging : ''}`}
          onPointerDown={onGridPointerDown}
          onPointerMove={onGridPointerMove}
          onPointerUp={onGridPointerUp}
          onPointerCancel={onGridPointerUp}
        >
          {items.map((it) => (
            <div key={it.relPath} className={styles.card} onClick={() => onOpen(it)}>
              <div className={styles.thumb}>
                {it.type === 'dir' ? (
                  <div className={styles.folderIcon} style={folderHueStyle(it.mtimeMs)}>
                    <span className={styles.folderTab}></span>
                    <span className={styles.folderBody}></span>
                  </div>
                ) : IMAGE_EXT.includes((it.ext || '').toLowerCase()) ? (
                  <img src={it.url} alt={it.name} />
                ) : (
                  <div className={styles.fileIcon}>
                    <span className={styles.fileExt}>{(it.ext || '').toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className={styles.meta}>
                <div className={styles.name} title={it.name}>{it.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className={styles.previewOverlay} onClick={() => setPreview(null)}>
          <div className={styles.previewWindow} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <div className={styles.previewTitle}>{preview.name}</div>
              <button className={styles.previewClose} onClick={() => setPreview(null)}>×</button>
            </div>
            <div className={styles.previewBody}>
              {preview.kind === 'image' ? (
                <div
                  ref={zoomHostRef}
                  className={styles.zoomHost}
                  onWheel={onWheelZoom}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onDoubleClick={onDoubleClick}
                >
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className={styles.zoomImage}
                    draggable={false}
                    style={{ transform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${zoomScale})` }}
                  />
                </div>
              ) : (
                <div ref={pdfHostRef} className={styles.pdfContainer}>
                  <Worker workerUrl="/pdf.worker.min.js">
                    <Viewer fileUrl={preview.url} theme={{ theme: 'dark' }} />
                  </Worker>
                  <div
                    className={`${styles.pdfDragOverlay} ${pdfDraggingRef.current ? styles.dragging : ''}`}
                    onPointerDown={onPdfPointerDown}
                    onPointerMove={onPdfPointerMove}
                    onPointerUp={onPdfPointerUp}
                    onPointerCancel={onPdfPointerUp}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 