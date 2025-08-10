/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState, useRef, useContext } from 'react';
import axios from 'axios';
import styles from '../../styles/Cards.module.scss';
import { Ebook } from '../../types';
import dynamic from 'next/dynamic';
import { ChevronBack, ChevronForward } from '../../utils/icons';
import { FeaturedContext } from '../../context/FeaturedContext';

const EbookCards = dynamic(import('./Cards'));

type RowProps = {
  setGlobalDragging?: (d: boolean) => void;
  maxItems?: number;
  heading?: string;
  rowKey?: string;
  offset?: number;
};

export default function EbooksRow({ setGlobalDragging, maxItems, heading = 'Arsip', rowKey = 'ebooks', offset = 0 }: RowProps): React.ReactElement {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef<'pending' | 'horizontal' | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startScroll = useRef(0);
  const { registerRowItems, clearRowItems, globalSearch } = useContext(FeaturedContext);

  const fixedFive = maxItems === 5;

  useEffect(() => {
    axios.get('/api/ebooks').then(res => {
      const data: Ebook[] = res.data.data || [];
      let base = data;
      if (typeof maxItems === 'number' && maxItems > 0) {
        // pick a unique window of size maxItems using offset, with wrap-around
        const n = data.length;
        const win = Math.min(maxItems, n || maxItems);
        const start = n > 0 ? ((offset % n) + n) % n : 0;
        const sliced: Ebook[] = [];
        for (let i = 0; i < win; i++) {
          sliced.push(data[(start + i) % (n || win)] || data[i % (n || win)]);
        }
        base = sliced;
      }
      const extended = typeof maxItems === 'number' && maxItems > 0 ? base : [...base, ...base, ...base, ...base];
      setEbooks(extended);
      registerRowItems(rowKey, extended as any);
      setIsLoaded(true);
    });
    return () => clearRowItems(rowKey);
  }, [registerRowItems, clearRowItems, maxItems, rowKey, offset]);

  const scrollBy = (delta: number) => {
    if (scrollerRef.current) scrollerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollerRef.current) return;
    if (fixedFive) return; // disable drag when fixed layout
    modeRef.current = 'pending';
    setGlobalDragging?.(false);
    startX.current = e.clientX;
    startY.current = e.clientY;
    startScroll.current = scrollerRef.current.scrollLeft;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (fixedFive) return; // disable drag when fixed layout
    const mode = modeRef.current;
    if (!scrollerRef.current || mode === null) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const THRESHOLD = 8;
    const BIAS = 4;

    if (mode === 'pending') {
      if (absDx > THRESHOLD && absDx > absDy + BIAS) {
        modeRef.current = 'horizontal';
        setGlobalDragging?.(true);
        try { scrollerRef.current.setPointerCapture((e as any).pointerId); } catch {}
      } else if (absDy > THRESHOLD && absDy > absDx + BIAS) {
        modeRef.current = null;
        setGlobalDragging?.(false);
        return;
      } else {
        return;
      }
    }

    if (modeRef.current === 'horizontal') {
      scrollerRef.current.scrollLeft = startScroll.current - dx;
      e.preventDefault();
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollerRef.current) return;
    try { scrollerRef.current.releasePointerCapture((e as any).pointerId); } catch {}
    modeRef.current = null;
    setGlobalDragging?.(false);
  };

  const filtered = ebooks
    .filter((e) => {
      if (!globalSearch) return true;
      const q = globalSearch.toLowerCase();
      return e.title.toLowerCase().includes(q) || e.overview.toLowerCase().includes(q);
    })
    .slice(0, typeof maxItems === 'number' && maxItems > 0 ? maxItems : undefined);

  // Ensure exactly 5 card slots when fixed
  const targetCount = typeof maxItems === 'number' && maxItems > 0 ? maxItems : filtered.length;
  const missing = Math.max(0, targetCount - filtered.length);
  const filled: (Ebook | null)[] = fixedFive ? [...filtered, ...Array(missing).fill(null)] : filtered;

  const placeholders = Array.from({ length: typeof maxItems === 'number' && maxItems > 0 ? maxItems : 10 }).map((_, i) => (
    <div key={`ph-e-${i}`} className={styles.card} style={{ opacity: 0.35, background: 'linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.08))' }} />
  ));

  return (
    <div className={`${styles.listContainer} ${fixedFive ? styles.fiveAcross : ''}`} data-row={rowKey}>
      <strong className={styles.category}>{heading}</strong>
      {!fixedFive && (
        <button className={`${styles.navButton} ${styles.navLeft}`} onClick={() => scrollBy(-400)} aria-label='Scroll left'>
          <ChevronBack />
        </button>
      )}
      <div
        ref={scrollerRef}
        className={`${styles.scroller} ${fixedFive ? styles.scrollerStatic : ''}`}
        data-nodrag
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className={`${styles.cardRow} ${fixedFive ? styles.cardRowFive : ''}`}>
          {!isLoaded && placeholders}
          {isLoaded && filled.map((ebook, i) => (
            ebook ? <EbookCards key={`e-${rowKey}-${i}`} item={ebook} /> : <div key={`e-ph-${rowKey}-${i}`} className={styles.card} />
          ))}
        </div>
      </div>
      {!fixedFive && (
        <button className={`${styles.navButton} ${styles.navRight}`} onClick={() => scrollBy(400)} aria-label='Scroll right'>
          <ChevronForward />
        </button>
      )}
    </div>
  );
} 