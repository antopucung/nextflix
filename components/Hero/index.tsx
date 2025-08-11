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

const CYCLE_MS = 7000; // waktu per slide
const FADE_MS = 2000; // durasi crossfade (screensaver)
const FAST_FADE_MS = 600; // fade cepat saat user pilih
const IDLE_MS = 15000; // mulai screensaver setelah idle 15s
const POST_VIDEO_IDLE_MS = 5000; // tidak dipakai di file ini (disimpan jika dipakai di tempat lain)

export default function Hero(): React.ReactElement {
  const router = useRouter();
  const isMilestonesPage = router.pathname === '/milestones';
  const isEbooksPage = router.pathname === '/arsip-gallery';

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [overlaySlide, setOverlaySlide] = useState<HeroSlide | null>(null);
  const [isFading, setIsFading] = useState(false);
  const firstShowRef = useRef(true);

  const { play } = useContext(PlayerContext);
  const { setModalData, setIsModal } = useContext(ModalContext);
  const {
    selectedMedia,
    candidates,
    isScreensaverPaused,
    setScreensaverPaused,
    lastActivityAt,
    markActivity,
    setCurrentSlide
  } = useContext(FeaturedContext);
  const { open: openReader } = useContext(ReaderContext);

  const [idx, setIdx] = useState(0);

  const fadeTimeoutRef = useRef<number | null>(null);
  const pendingSlideRef = useRef<HeroSlide | null>(null);
  const saverIntervalRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  // ===========================
  // 1) DAFTAR VIDEO (URUTAN LINE)
  // ===========================
  const videos = [
    '/content/movies/1.Garuda-Pancasila-Sejarah-Penciptaan-Lambang-Negara/video-1.mp4',
    '/content/movies/2.Salam-Merdeka-dan-Salam-Pancasila/video-2.mp4',
    '/content/movies/3.Buku-Api-Pancasila/video-3.mp4',
    '/content/movies/4.REV-SALAM-PANCASILA/video-4.mp4'
  ];

  // Global activity listeners to reset idle timer
  useEffect(() => {
    if (isMilestonesPage) return; // on milestones, biarkan saver jalan terus
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

  // Idle watchdog: JANGAN pause di awal — biar hero langsung muncul
  useEffect(() => {
    if (isMilestonesPage) return; // always on
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    // aktifkan screensaver segera saat load
    setScreensaverPaused(false);

    // setelah idle, tetap aktifkan screensaver
    idleTimerRef.current = window.setTimeout(() => {
      setScreensaverPaused(false);
    }, IDLE_MS) as unknown as number;

    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [lastActivityAt, setScreensaverPaused, isMilestonesPage]);

  // Bangun pool dari candidates (dynamic)
  const pool: HeroSlide[] = (candidates?.length ? candidates : []).slice(0, 24).map(m => ({
    id: m.id,
    img: m.banner || m.poster,
    title: m.title,
    synopsis: m.overview
  }));

  // Tampilkan slide pertama segera ketika pool siap (tanpa nunggu interval)
  useEffect(() => {
    if (!overlaySlide && pool.length) {
      const first = pool[0];
      setOverlaySlide(first);
      setCurrentSlide(first);
      publishHeroSlide(first);
      firstShowRef.current = false; // sudah tampil pertama kali
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.length, overlaySlide]);

  const startFade = (duration: number) => {
    const el = overlayRef.current;
    if (!el) return;
    // JANGAN set 'none' + opacity 0 lagi — slide baru sudah render dengan 0 karena isFading = true
    el.style.transition = `opacity ${duration}ms ease-in-out`;
    el.style.opacity = '1';
  };

  // Core crossfade; overlay selalu yang dirender (tidak ada base card)
  const crossfadeTo = (next: HeroSlide, duration: number) => {
    // Hindari flicker kalau slidenya sama
    if (overlaySlide && overlaySlide.id === next.id && overlaySlide.img === next.img) return;

    const isFirst = firstShowRef.current;

    if (isFirst) {
      firstShowRef.current = false;
      setOverlaySlide(next);
      setCurrentSlide(next);
      publishHeroSlide(next);
      setIsFading(false);
      return;
    }

    // ⬇⬇ KUNCI ANTI FLICKER: setIsFading dulu, baru ganti slide
    setIsFading(true);
    setOverlaySlide(next);
    setCurrentSlide(next);
    publishHeroSlide(next);

    requestAnimationFrame(() => startFade(duration));

    if (fadeTimeoutRef.current) window.clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = window.setTimeout(() => {
      setIsFading(false);
      if (pendingSlideRef.current) {
        const pending = pendingSlideRef.current;
        pendingSlideRef.current = null;
        crossfadeTo(pending, FAST_FADE_MS);
      }
    }, duration) as unknown as number;
  };

  // Jika user memilih card: antri / crossfade cepat
  useEffect(() => {
    if (!selectedMedia) return;
    const next: HeroSlide = {
      id: selectedMedia.id,
      img: selectedMedia.banner || selectedMedia.poster,
      title: selectedMedia.title,
      synopsis: selectedMedia.overview
    };
    if (isFading) {
      pendingSlideRef.current = next;
    } else {
      crossfadeTo(next, FAST_FADE_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMedia, isFading]);

  // Start/stop screensaver (rotasi otomatis)
  useEffect(() => {
    if (saverIntervalRef.current) {
      window.clearInterval(saverIntervalRef.current);
      saverIntervalRef.current = null;
    }
    if (selectedMedia || !pool.length) return;
    if (!isMilestonesPage && isScreensaverPaused) return; // on milestones, abaikan idle pause

    const advance = () => {
      if (!pool.length) return;
      const next = pool[(idx + 1) % pool.length];
      if (isFading) return;
      crossfadeTo(next, FADE_MS);
      setIdx(i => (i + 1) % pool.length);
    };

    saverIntervalRef.current = window.setInterval(advance, CYCLE_MS) as unknown as number;

    return () => {
      if (saverIntervalRef.current) window.clearInterval(saverIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.length, selectedMedia, idx, isFading, isScreensaverPaused, isMilestonesPage]);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) window.clearTimeout(fadeTimeoutRef.current);
      if (saverIntervalRef.current) window.clearInterval(saverIntervalRef.current);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Helper: cari URL video berdasarkan urutan slide di pool
  const videoForSlide = (s: HeroSlide): string => {
    const i = pool.findIndex(p => p.id === s.id);
    const idxInPool = i === -1 ? 0 : i;
    return videos[idxInPool % videos.length];
    // NOTE:
    // - Urutan videos[] HARUS sesuai urutan slide di pool (line order).
    // - Kalau pool > videos.length, dia wrap pakai modulo.
  };

  // Helper ambil slide aktif
  const getCurrentSlide = (): HeroSlide | null => overlaySlide;

  const toMedia = (s: HeroSlide): Media =>
    ({
      id: s.id,
      title: s.title,
      overview: s.synopsis,
      poster: s.img,
      banner: s.img,
      rating: 4.5,
      genre: [],
      // inject videoUrl biar PlayerContext pakai file lokal
      videoUrl: videoForSlide(s)
    } as any as Media);

  const onPlayCurrent = () => {
    const slide = getCurrentSlide();
    if (!slide) return;
    setScreensaverPaused(true);
    markActivity();

    if (isEbooksPage) {
      const ebookMaybe = (candidates || []).find(m => m.id === slide.id) as any;
      if (ebookMaybe && ebookMaybe.pdfUrl) {
        openReader(ebookMaybe);
        return;
      }
    }

    // PENTING: media sudah berisi videoUrl lokal
    play(toMedia(slide));
  };

  const onInfoCurrent = () => {
    const slide = getCurrentSlide();
    if (!slide) return;
    markActivity();
    setScreensaverPaused(true); // cegah rotasi saat modal terbuka
    const media = toMedia(slide);
    setModalData(media);
    setIsModal(true);
  };

  // Update current slide ke context tiap overlaySlide berubah
  useEffect(() => {
    if (!overlaySlide) return;
    setCurrentSlide(overlaySlide);
    publishHeroSlide(overlaySlide);
  }, [overlaySlide, setCurrentSlide]);

  return (
    <div className={styles.hero}>
      {/* Overlay layer (satu-satunya yang dirender) */}
      {overlaySlide && (
        <div
          ref={overlayRef}
          className={styles.scroller}
          style={{ position: 'absolute', inset: 0, opacity: isFading ? 0 : 1 }}>
          <div className={styles.slide}>
            <img className={styles.image} src={overlaySlide.img} alt={overlaySlide.title} loading='eager' />
            <div className={styles.details}>
              <div className={styles.title}>{overlaySlide.title}</div>
              <div className={styles.synopsis}>{overlaySlide.synopsis}</div>
              <div className={styles.buttons}>
                <Button
                  label={isEbooksPage ? 'Read' : 'Play'}
                  filled
                  Icon={isEbooksPage ? Book : Play}
                  onClick={onPlayCurrent}
                />
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
