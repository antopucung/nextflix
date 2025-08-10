/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState, useRef, useContext } from 'react';
import axios from 'axios';
import styles from '../../styles/Timeline.module.scss';
import { ChevronBack, ChevronForward } from '../../utils/icons';
import { FeaturedContext } from '../../context/FeaturedContext';
import { publishMilestonesState, publishMilestonesScroll } from '../../utils/heroSync';

type Milestone = { id: number; title: string; overview: string; banner: string };

type DragMode = 'pending' | 'horizontal' | null;

export default function Timeline(): React.ReactElement {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef<DragMode>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startScroll = useRef(0);
  const currentIndexRef = useRef<number>(0);
  const initialIndexRef = useRef<number>(0);
  const snapDebounceRef = useRef<number | null>(null);
  const autoplayRef = useRef<number | null>(null);
  const isUserInteractingRef = useRef<boolean>(false);
  const { registerRowItems, clearRowItems, setFeatured, setSelected, selectedMedia, selectedKey, globalSearch } = useContext(FeaturedContext);

  // Load and register items
  useEffect(() => {
    axios.get('/api/milestones').then(res => {
      const data: Milestone[] = res.data.data || [];
      const extended = [...data, ...data, ...data];
      setMilestones(extended);
      registerRowItems('milestones', extended as any);
      publishMilestonesState(extended as any, 0);
    });
    return () => clearRowItems('milestones');
  }, [registerRowItems, clearRowItems]);

  // Utilities to work with card elements
  const getCards = (): HTMLElement[] => {
    const scroller = scrollerRef.current;
    if (!scroller) return [];
    return Array.from(scroller.querySelectorAll(`.${styles.card}`)) as HTMLElement[];
  };

  const getNearestIndexToCenter = (): number => {
    const scroller = scrollerRef.current;
    if (!scroller) return 0;
    const cards = getCards();
    if (cards.length === 0) return 0;
    const viewportCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;
    cards.forEach((card, i) => {
      const center = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - viewportCenter);
      if (dist < best) { best = dist; nearest = i; }
    });
    return nearest;
  };

  const publishState = (indexOverride?: number) => {
    const items = milestones;
    const idx = typeof indexOverride === 'number' ? indexOverride : getNearestIndexToCenter();
    publishMilestonesState(items as any, idx);
  };

  const snapToIndex = (index: number, smooth = true) =>
    requestAnimationFrame(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const cards = getCards();
      if (!cards.length) return; // guard against empty render
      const clamped = ((index % cards.length) + cards.length) % cards.length;
      const target = cards[clamped].offsetLeft + cards[clamped].offsetWidth / 2 - scroller.clientWidth / 2;
      scroller.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
    });

  const snapToCenter = (smooth = true) => {
    const idx = getNearestIndexToCenter();
    snapToIndex(idx, smooth);
  };

  const debouncedSnap = () => {
    if (snapDebounceRef.current) window.clearTimeout(snapDebounceRef.current);
    snapDebounceRef.current = window.setTimeout(() => {
      if (modeRef.current === 'horizontal') return; // don't snap mid-drag
      const idx = getNearestIndexToCenter();
      publishState(idx);
      snapToCenter(true);
    }, 160) as unknown as number;
  };

  // Nav actions now snap to prev/next centered card
  const goPrev = () => {
    const idx = getNearestIndexToCenter();
    snapToIndex(idx - 1, true);
  };
  const goNext = () => {
    const idx = getNearestIndexToCenter();
    snapToIndex(idx + 1, true);
  };

  // Autoplay: advance every 6s, pause during user interaction
  const startAutoplay = () => {
    if (autoplayRef.current) window.clearInterval(autoplayRef.current);
    autoplayRef.current = window.setInterval(() => {
      if (isUserInteractingRef.current) return;
      goNext();
    }, 6000) as unknown as number;
  };
  const stopAutoplay = () => {
    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  };

  useEffect(() => {
    // Initial center and start autoplay after items render
    const init = window.setTimeout(() => {
      snapToCenter(false);
      publishState();
      startAutoplay();
    }, 0);
    return () => {
      window.clearTimeout(init);
      stopAutoplay();
      if (snapDebounceRef.current) window.clearTimeout(snapDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestones.length]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollerRef.current) return;
    modeRef.current = 'pending';
    startX.current = e.clientX;
    startY.current = e.clientY;
    startScroll.current = scrollerRef.current.scrollLeft;
    initialIndexRef.current = getNearestIndexToCenter();
    isUserInteractingRef.current = true;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const mode = modeRef.current;
    if (!scrollerRef.current || mode === null) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const THRESHOLD = 4; // more sensitive than other rows
    const BIAS = 2;

    if (mode === 'pending') {
      if (absDx > THRESHOLD && absDx > absDy + BIAS) {
        modeRef.current = 'horizontal';
        try { scrollerRef.current.setPointerCapture((e as any).pointerId); } catch {}
      } else if (absDy > THRESHOLD && absDy > absDx + BIAS) {
        modeRef.current = null;
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
    const totalDx = e.clientX - startX.current;
    const SWIPE_TRIGGER_PX = 35; // small distance to change card
    if (modeRef.current === 'horizontal' && Math.abs(totalDx) > SWIPE_TRIGGER_PX) {
      const dir = totalDx < 0 ? 1 : -1; // swipe left -> next
      snapToIndex(initialIndexRef.current + dir, true);
    } else {
      snapToCenter(true);
    }
    modeRef.current = null;
    // Resume autoplay shortly after user finishes dragging
    window.setTimeout(() => { isUserInteractingRef.current = false; }, 300);
  };

  const filtered = milestones.filter((m) => {
    if (!globalSearch) return true;
    const q = globalSearch.toLowerCase();
    return m.title.toLowerCase().includes(q) || m.overview.toLowerCase().includes(q);
  });

  const onHover = (m: Milestone) => setFeatured(m as any);
  const onLeave = () => setFeatured(null);
  const onSelect = (m: Milestone, el: HTMLElement | null) => {
    const row = el?.closest('[data-row]') as HTMLElement | null;
    const rowKey = row?.getAttribute('data-row') || 'milestones';
    setSelected(m as any, `${rowKey}:${m.id}`);
  };

  const isSelected = (m: Milestone, el: HTMLElement | null) => selectedMedia?.id === (m as any).id && selectedKey?.startsWith((el?.closest('[data-row]') as HTMLElement | null)?.getAttribute('data-row') || '');

  return (
    <div className={styles.container} data-row='milestones'>
      <strong className={styles.heading}>Lini Masa Timeline</strong>
      <button className={`${styles.navButton} ${styles.navLeft}`} onClick={goPrev} aria-label='Scroll left'>
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
        onScroll={debouncedSnap}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className={styles.row}>
          {filtered.map((m, i) => (
            <div key={`m-${i}`} className={`${styles.card} ${isSelected(m, scrollerRef.current) ? styles.selected : ''}`}
              onMouseEnter={() => onHover(m)} onMouseLeave={onLeave}
              onClick={(e) => onSelect(m, e.currentTarget as HTMLElement)}>
              <img
                src={m.banner}
                alt={m.title}
                className={styles.poster}
                loading="lazy"
                decoding="async"
                sizes="(min-width: 1280px) 28vw, (min-width: 768px) 40vw, 60vw"
              />
              <div className={styles.cardInfo}>
                <strong>{m.title}</strong>
                <p>{m.overview}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className={`${styles.navButton} ${styles.navRight}`} onClick={goNext} aria-label='Scroll right'>
        <ChevronForward />
      </button>
    </div>
  );
} 