/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState, useRef, useContext } from 'react';
import axios from 'axios';
import styles from '../../styles/Cards.module.scss';
import { Ebook } from '../../types';
import dynamic from 'next/dynamic';
import { ChevronBack, ChevronForward } from '../../utils/icons';
import { FeaturedContext } from '../../context/FeaturedContext';

const EbookCards = dynamic(import('./Cards'));

export default function EbooksRow({ setGlobalDragging }: { setGlobalDragging?: (d: boolean) => void }): React.ReactElement {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef<'pending' | 'horizontal' | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startScroll = useRef(0);
  const { registerRowItems, clearRowItems, globalSearch } = useContext(FeaturedContext);

  useEffect(() => {
    axios.get('/api/ebooks').then(res => {
      const data: Ebook[] = res.data.data || [];
      const extended = [...data, ...data, ...data, ...data];
      setEbooks(extended);
      registerRowItems('ebooks', extended as any);
    });
    return () => clearRowItems('ebooks');
  }, [registerRowItems, clearRowItems]);

  const scrollBy = (delta: number) => {
    if (scrollerRef.current) scrollerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollerRef.current) return;
    modeRef.current = 'pending';
    setGlobalDragging?.(false);
    startX.current = e.clientX;
    startY.current = e.clientY;
    startScroll.current = scrollerRef.current.scrollLeft;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
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

  const filtered = ebooks.filter((e) => {
    if (!globalSearch) return true;
    const q = globalSearch.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.overview.toLowerCase().includes(q);
  });

  return (
    <div className={styles.listContainer} data-row='ebooks'>
      <strong className={styles.category}>Ebooks</strong>
      <button className={`${styles.navButton} ${styles.navLeft}`} onClick={() => scrollBy(-400)} aria-label='Scroll left'>
        <ChevronBack />
      </button>
      <div
        ref={scrollerRef}
        className={styles.scroller}
        data-nodrag
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className={styles.cardRow}>
          {filtered.map((ebook, i) => (
            <EbookCards key={`e-${i}`} item={ebook} />
          ))}
        </div>
      </div>
      <button className={`${styles.navButton} ${styles.navRight}`} onClick={() => scrollBy(400)} aria-label='Scroll right'>
        <ChevronForward />
      </button>
    </div>
  );
} 