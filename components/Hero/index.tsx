/* eslint-disable @next/next/no-img-element */
import React, { useContext, useEffect, useRef, useState } from 'react';
import styles from '../../styles/Hero.module.scss';
import Button from '../Button';
import { Play, Info, Book } from '../../utils/icons';
import type { HeroSlide, Media } from '../../types';
import { PlayerContext } from '../../context/PlayerContext';
import { ModalContext } from '../../context/ModalContext';
import { FeaturedContext } from '../../context/FeaturedContext';
import { publishHeroSlide } from '../../utils/heroSync';
import { useRouter } from 'next/router';
import { ReaderContext } from '../../context/ReaderContext';

const fallbackSlides: HeroSlide[] = [
  { id: 1, img: '/content/hero/slide-1.jpg', title: 'Nextflix', synopsis: 'A simple Netflix clone built using Next.js' }
];

const CYCLE_MS = 7000; // time per slide
const FADE_MS = 2000; // crossfade duration (screensaver)
const FAST_FADE_MS = 600; // faster crossfade for user selections
const IDLE_MS = 15000; // start screensaver after 15s inactivity
const POST_VIDEO_IDLE_MS = 5000; // after video ends, wait 5s then screensaver

export default function Hero(): React.ReactElement {
  const router = useRouter();
  const isMilestonesPage = router.pathname === '/milestones';
  const isEbooksPage = router.pathname === '/ebooks';
  const baseRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [baseSlide, setBaseSlide] = useState<HeroSlide>(fallbackSlides[0]);
  const [overlaySlide, setOverlaySlide] = useState<HeroSlide | null>(null);
  const [isFading, setIsFading] = useState(false);
  const { play } = useContext(PlayerContext);
  const { setModalData, setIsModal } = useContext(ModalContext);
  const { selectedMedia, candidates, isScreensaverPaused, setScreensaverPaused, lastActivityAt, markActivity, setCurrentSlide } = useContext(FeaturedContext);
  const { open: openReader } = useContext(ReaderContext);
  const [idx, setIdx] = useState(0);

  const fadeTimeoutRef = useRef<number | null>(null);
  const pendingSlideRef = useRef<HeroSlide | null>(null);
  const saverIntervalRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  // Global activity listeners to reset idle timer
  useEffect(() => {
    if (isMilestonesPage) return; // on milestones, let saver run continuously
    const onActivity = () => markActivity();
    window.addEventListener('pointerdown', onActivity, { passive: true });
    window.addEventListener('pointermove', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity);
    return () => {
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('pointermove', onActivity);
      window.removeEventListener('keydown', onActivity);
    };
  }, [markActivity, isMilestonesPage]);

  // Idle watchdog: pause/resume screensaver based on inactivity (skip on milestones page)
  useEffect(() => {
    if (isMilestonesPage) return; // always on
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    idleTimerRef.current = window.setTimeout(() => {
      setScreensaverPaused(false);
    }, IDLE_MS) as unknown as number;
    setScreensaverPaused(true);
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [lastActivityAt, setScreensaverPaused, isMilestonesPage]);

  // Optional static hero as ultimate fallback; real content comes from candidates/selection
  useEffect(() => {
    fetch('/api/hero')
      .then((r) => r.json())
      .then((res) => {
        if (res?.data?.length && !selectedMedia && (!candidates || candidates.length === 0)) {
          const s = res.data[0] as HeroSlide;
          setBaseSlide(s);
        }
      })
      .catch(() => {});
  }, [selectedMedia, candidates?.length]);

  // Build dynamic pool from candidates
  const pool: HeroSlide[] = (candidates?.length ? candidates : [])
    .slice(0, 24)
    .map((m) => ({ id: m.id, img: m.banner || m.poster, title: m.title, synopsis: m.overview }));

  // Helper to start a robust fade on the overlay element
  const startFade = (duration: number) => {
    const el = overlayRef.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.opacity = '0';
    // Force reflow
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    (el as any).offsetHeight;
    requestAnimationFrame(() => {
      const el2 = overlayRef.current;
      if (!el2) return;
      el2.style.transition = `opacity ${duration}ms ease-in-out`;
      el2.style.opacity = '1';
    });
  };

  // Core crossfade that finishes current fade before processing any pending slide
  const crossfadeTo = (next: HeroSlide, duration: number) => {
    setOverlaySlide(next);
    setIsFading(true);
    setCurrentSlide(next);
    publishHeroSlide(next);
    requestAnimationFrame(() => startFade(duration));
    if (fadeTimeoutRef.current) window.clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = window.setTimeout(() => {
      setBaseSlide(next);
      setOverlaySlide(null);
      setIsFading(false);
      if (pendingSlideRef.current) {
        const pending = pendingSlideRef.current;
        pendingSlideRef.current = null;
        crossfadeTo(pending, FAST_FADE_MS);
      }
    }, duration) as unknown as number;
  };

  // If user selects a card: queue or crossfade with fast duration
  useEffect(() => {
    if (!selectedMedia) return;
    const next: HeroSlide = { id: selectedMedia.id, img: selectedMedia.banner || selectedMedia.poster, title: selectedMedia.title, synopsis: selectedMedia.overview };
    if (isFading) {
      pendingSlideRef.current = next;
    } else {
      crossfadeTo(next, FAST_FADE_MS);
    }
  }, [selectedMedia, isFading]);

  // Start/stop screensaver
  useEffect(() => {
    if (saverIntervalRef.current) {
      window.clearInterval(saverIntervalRef.current);
      saverIntervalRef.current = null;
    }
    if (selectedMedia || !pool.length) return;
    if (!isMilestonesPage && isScreensaverPaused) return; // on milestones, ignore idle pause

    const advance = () => {
      const next = pool[(idx + 1) % pool.length];
      if (isFading) return;
      crossfadeTo(next, FADE_MS);
      setIdx((i) => (i + 1) % pool.length);
    };

    advance();
    saverIntervalRef.current = window.setInterval(advance, CYCLE_MS) as unknown as number;
    return () => {
      if (saverIntervalRef.current) window.clearInterval(saverIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.length, selectedMedia, idx, isFading, isScreensaverPaused, isMilestonesPage]);

  useEffect(() => () => {
    if (fadeTimeoutRef.current) window.clearTimeout(fadeTimeoutRef.current);
    if (saverIntervalRef.current) window.clearInterval(saverIntervalRef.current);
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
  }, []);

  // Helper to get the slide currently visible to the user
  const getCurrentSlide = (): HeroSlide => (overlaySlide ?? baseSlide);

  const toMedia = (s: HeroSlide): Media => ({
    id: s.id,
    title: s.title,
    overview: s.synopsis,
    poster: s.img,
    banner: s.img,
    rating: 4.5,
    genre: []
  } as Media);

  const onPlayCurrent = () => {
    const slide = getCurrentSlide();
    setScreensaverPaused(true);
    markActivity();

    if (isEbooksPage) {
      const ebookMaybe = (candidates || []).find((m) => m.id === slide.id) as any;
      if (ebookMaybe && ebookMaybe.pdfUrl) {
        openReader(ebookMaybe);
        return;
      }
    }

    play(toMedia(slide));
  };

  const onInfoCurrent = () => {
    const slide = getCurrentSlide();
    markActivity();
    const media = toMedia(slide);
    setModalData(media);
    setIsModal(true);
  };

  useEffect(() => {
    const slide = overlaySlide ?? baseSlide;
    setCurrentSlide(slide);
    publishHeroSlide(slide);
  }, [overlaySlide, baseSlide, setCurrentSlide]);

  return (
    <div className={styles.hero}>
      {/* Base layer */}
      <div ref={baseRef} className={styles.scroller} style={{ opacity: 1 }}>
        <div className={styles.slide}>
          <img className={styles.image} src={baseSlide.img} alt={baseSlide.title} />
          <div className={styles.details}>
            <div className={styles.title}>{baseSlide.title}</div>
            <div className={styles.synopsis}>{baseSlide.synopsis}</div>
            <div className={styles.buttons}>
              <Button label={isEbooksPage ? 'Read' : 'Play'} filled Icon={isEbooksPage ? Book : Play} onClick={onPlayCurrent} />
              <Button label='More Info' Icon={Info} onClick={onInfoCurrent} />
            </div>
          </div>
        </div>
      </div>

      {/* Overlay cross-fade layer */}
      {overlaySlide && (
        <div ref={overlayRef} className={styles.scroller} style={{ position: 'absolute', inset: 0, opacity: 0 }}>
          <div className={styles.slide}>
            <img className={styles.image} src={overlaySlide.img} alt={overlaySlide.title} />
            <div className={styles.details}>
              <div className={styles.title}>{overlaySlide.title}</div>
              <div className={styles.synopsis}>{overlaySlide.synopsis}</div>
              <div className={styles.buttons}>
                <Button label={isEbooksPage ? 'Read' : 'Play'} filled Icon={isEbooksPage ? Book : Play} onClick={onPlayCurrent} />
                <Button label='More Info' Icon={Info} onClick={onInfoCurrent} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dots */}
      <div className={styles.dots}>
        <button className={`${styles.dot} ${!isFading ? styles.active : ''}`} aria-label='active' />
      </div>
    </div>
  );
} 