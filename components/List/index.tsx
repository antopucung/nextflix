import React, { useEffect, useState, useRef, useContext } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

import { Media } from '../../types';
import styles from '../../styles/Cards.module.scss';
import { ChevronBack, ChevronForward } from '../../utils/icons';
import { FeaturedContext } from '../../context/FeaturedContext';

const Cards = dynamic(import('./Cards'));
const FeatureCard = dynamic(import('./FeatureCards'));

interface ListProps {
  defaultCard?: boolean;
  heading: string;
  topList?: boolean;
  endpoint: string;
  setGlobalDragging?: (d: boolean) => void;
}

type DragMode = 'pending' | 'horizontal' | null;

export default function List({
  defaultCard = true,
  heading,
  topList = false,
  endpoint,
  setGlobalDragging
}: ListProps): React.ReactElement {
  const [media, setMedia] = useState<Media[] | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef<DragMode>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startScroll = useRef(0);
 
  const { registerRowItems, clearRowItems } = useContext(FeaturedContext);
  const { globalSearch } = useContext(FeaturedContext);
 
  async function fetchData() {
    try {
      const result = await axios.get(endpoint);
      const data: Media[] = result.data.data || [];
      const extended = [...data, ...data, ...data, ...data];
      setMedia(extended);
      registerRowItems(heading, extended);
    } catch (error) {
      setMedia([]);
      registerRowItems(heading, []);
    } finally {
      setIsLoaded(true);
    }
  }

  useEffect(() => {
    // Lazy-load when the row comes into view (preload generously so hero has candidates)
    const el = listRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchData();
          obs.disconnect();
        }
      },
      { rootMargin: '1200px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [endpoint]);

  useEffect(() => () => { clearRowItems(heading); }, [heading, clearRowItems]);

  const scrollBy = (delta: number) => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollerRef.current) return;
    modeRef.current = 'pending';
    setGlobalDragging?.(false);
    startX.current = e.clientX;
    startY.current = e.clientY;
    startScroll.current = scrollerRef.current.scrollLeft;
    // eslint-disable-next-line no-console
    console.log('[Row]', heading, 'pointerdown', { x: e.clientX, y: e.clientY });
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
        // eslint-disable-next-line no-console
        console.log('[Row]', heading, 'mode -> horizontal');
      } else if (absDy > THRESHOLD && absDy > absDx + BIAS) {
        modeRef.current = null;
        setGlobalDragging?.(false);
        // eslint-disable-next-line no-console
        console.log('[Row]', heading, 'mode -> vertical (bubble to page)');
        return;
      } else {
        // eslint-disable-next-line no-console
        console.log('[Row]', heading, 'pending move', { dx, dy, absDx, absDy });
        return;
      }
    }

    if (modeRef.current === 'horizontal') {
      scrollerRef.current.scrollLeft = startScroll.current - dx;
      e.preventDefault();
      // eslint-disable-next-line no-console
      console.log('[Row]', heading, 'drag horizontal', { dx, scrollLeft: scrollerRef.current.scrollLeft });
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollerRef.current) return;
    try { scrollerRef.current.releasePointerCapture((e as any).pointerId); } catch {}
    // eslint-disable-next-line no-console
    console.log('[Row]', heading, 'pointerend', { mode: modeRef.current });
    modeRef.current = null;
    setGlobalDragging?.(false);
  };

  const placeholders = Array.from({ length: 10 }).map((_, i) => (
    <div key={`ph-${i}`} className={styles.card} style={{ opacity: 0.35, background: 'linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.08))' }} />
  ));

  return (
    <div className={styles.listContainer} ref={listRef} data-row={heading.replace(/\s+/g, '-').toLowerCase()}>
      <strong className={styles.category}>{heading}</strong>
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
          {!isLoaded && placeholders}
          {isLoaded && media?.
            filter((item) => {
              if (!globalSearch) return true;
              const q = globalSearch.toLowerCase();
              return (
                item.title.toLowerCase().includes(q) ||
                item.overview.toLowerCase().includes(q)
              );
            })
            .map((item, index) => {
            if (topList) {
              if (index < 10) {
                return <FeatureCard key={`f-${index}`} index={index + 1} item={item} />;
              }
            } else {
              return (
                <Cards
                  key={`c-${item.id}-${index}`}
                  defaultCard={defaultCard}
                  item={{ ...item, id: Number(`${index + 1}${item.id}`) }}
                />
              );
            }
          })}
        </div>
      </div>
      <button className={`${styles.navButton} ${styles.navRight}`} onClick={() => scrollBy(400)} aria-label='Scroll right'>
        <ChevronForward />
      </button>
    </div>
  );
}
