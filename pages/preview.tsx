/* eslint-disable @next/next/no-img-element */
import React, { useContext, useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { FeaturedContext } from '../context/FeaturedContext';
import { PlayerContext } from '../context/PlayerContext';
import stylesHero from '../styles/Hero.module.scss';
import stylesTimeline from '../styles/Timeline.module.scss';
import Button from '../components/Button';
import { Play, Info, Book } from '../utils/icons';
import type { HeroSlide, Media } from '../types';
import { subscribeHeroSlide, subscribeScreensaver, subscribeMilestonesState, MilestonePayload, subscribeRoute, subscribeReader, subscribePlayer, subscribeReaderScroll, subscribeMilestonesScroll } from '../utils/heroSync';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const EbooksCarouselRow = dynamic(import('../components/EbooksCarousel/Row'));

function toMedia(s: HeroSlide): Media {
  return { id: s.id, title: s.title, overview: s.synopsis, poster: s.img, banner: s.img, rating: 4.5, genre: [] } as Media;
}

export default function Preview(): React.ReactElement {
  const router = useRouter();
  const [forceMilestones, setForceMilestones] = useState<boolean>(false);
  const [forceEbooks, setForceEbooks] = useState<boolean>(false);
  const isMilestones = forceMilestones || router.query?.route === 'milestones' || (typeof window !== 'undefined' && window.location.search.includes('milestones'));
  const isEbooks = forceEbooks || router.query?.route === 'ebooks' || (typeof window !== 'undefined' && window.location.search.includes('ebooks'));

  // Follow main route automatically
  useEffect(() => {
    const unsub = subscribeRoute((pathname) => {
      if (pathname === '/milestones') setForceMilestones(true);
      else setForceMilestones(false);
      if (pathname === '/arsip-gallery') setForceEbooks(true);
      else setForceEbooks(false);
    });
    return () => { unsub(); };
  }, []);

  // Hero mirroring
  const { currentSlide, setCurrentSlide, selectedMedia, candidates, setScreensaverPaused } = useContext(FeaturedContext);
  const { play } = useContext(PlayerContext);
  const [isSaverPaused, setIsSaverPaused] = useState<boolean>(false);

  useEffect(() => {
    const unsub1 = subscribeHeroSlide((slide) => setCurrentSlide(slide));
    const unsub2 = subscribeScreensaver((pause) => { setIsSaverPaused(pause); setScreensaverPaused(pause); });
    return () => { unsub1(); unsub2(); };
  }, [setCurrentSlide, setScreensaverPaused]);

  // Milestones mirroring (second screen fullscreen, no header) with idle return
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [msItems, setMsItems] = useState<MilestonePayload[]>([]);
  const [msIndex, setMsIndex] = useState<number>(0);

  const centerToIndex = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const cards = Array.from(scroller.querySelectorAll(`.${stylesTimeline.card}`)) as HTMLElement[];
    if (!cards.length) return;
    const clamped = ((msIndex % cards.length) + cards.length) % cards.length;
    const target = cards[clamped].offsetLeft + cards[clamped].offsetWidth / 2 - scroller.clientWidth / 2;
    scroller.scrollTo({ left: target, behavior: 'smooth' });
  }, [msIndex]);

  useEffect(() => {
    const unsub = subscribeMilestonesState((items, index) => {
      setMsItems(items);
      setMsIndex(index);
      requestAnimationFrame(centerToIndex);
    });
    return () => { unsub(); };
  }, [centerToIndex]);

  // Recenter on viewport resize/orientation changes for adaptive centering
  useEffect(() => {
    if (!isMilestones) return;
    const onResize = () => centerToIndex();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize as any);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize as any);
    };
  }, [isMilestones, centerToIndex]);

  // Idle timer: if no activity for 60s while showing milestones, return to main preview
  useEffect(() => {
    if (!isMilestones) return;
    let timer: number | null = null;
    const reset = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setForceMilestones(false), 60000) as unknown as number;
    };
    reset();
    const onAct = () => reset();
    document.addEventListener('pointerdown', onAct, { passive: true });
    document.addEventListener('pointermove', onAct, { passive: true });
    document.addEventListener('keydown', onAct);
    document.addEventListener('wheel', onAct, { passive: true });
    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener('pointerdown', onAct as any);
      document.removeEventListener('pointermove', onAct as any);
      document.removeEventListener('keydown', onAct as any);
      document.removeEventListener('wheel', onAct as any);
    };
  }, [isMilestones]);

  if (isEbooks) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'black', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div id='ebooks' style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex' }}>
            <EbooksCarouselRow heading='Arsip - A' offset={0} />
          </div>
          <div style={{ flex: 1, display: 'flex' }}>
            <EbooksCarouselRow heading='Arsip - B' offset={5} />
          </div>
          <div style={{ flex: 1, display: 'flex' }}>
            <EbooksCarouselRow heading='Arsip - C' offset={10} />
          </div>
        </div>
      </div>
    );
  }

  if (isMilestones) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'black', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div id='milestones' style={{ width: '100%', height: '100%' }}>
          <div className={stylesTimeline.scroller} ref={scrollerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className={stylesTimeline.row} style={{ justifyContent: 'center', alignItems: 'center' }}>
              {msItems.map((m, i) => (
                <div key={`m-prev-${i}`} className={stylesTimeline.card}>
                  <img className={stylesTimeline.poster} src={m.banner} alt={m.title} />
                  <div className={stylesTimeline.cardInfo}>
                    <strong>{m.title}</strong>
                    <p>{m.overview}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default preview (hero)
  const [baseSlide, setBaseSlide] = useState<HeroSlide>({ id: 0, img: '', title: '', synopsis: '' });
  const [overlaySlide, setOverlaySlide] = useState<HeroSlide | null>(null);
  const [fadeOpacity, setFadeOpacity] = useState<number>(0);

  useEffect(() => {
    if (!currentSlide) return;
    if (currentSlide.id === baseSlide.id && currentSlide.img === baseSlide.img) return;
    setOverlaySlide(currentSlide);
    setFadeOpacity(0);
    requestAnimationFrame(() => setFadeOpacity(1));
    const timer = window.setTimeout(() => {
      setBaseSlide(currentSlide);
      setOverlaySlide(null);
      setFadeOpacity(0);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [currentSlide, baseSlide.id, baseSlide.img]);

  const onPlay = () => play(toMedia(baseSlide));

  // Mirrored Reader overlay
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerTitle, setReaderTitle] = useState('');
  const [readerUrl, setReaderUrl] = useState('');
  const readerFrameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const unsub = subscribeReader(
      (ebook) => { setReaderOpen(true); setReaderTitle(ebook.title); setReaderUrl(ebook.pdfUrl); },
      () => { setReaderOpen(false); setReaderTitle(''); setReaderUrl(''); }
    );
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    const unsub = subscribeReaderScroll(({ dy }) => {
      const frame = readerFrameRef.current;
      if (!frame) return;
      try {
        const doc = frame.contentDocument || (frame as any).contentWindow?.document;
        if (doc) {
          doc.documentElement.scrollBy({ top: dy, behavior: 'auto' });
          doc.body?.scrollBy?.({ top: dy, behavior: 'auto' });
        }
      } catch {}
    });
    return () => { unsub(); };
  }, []);

  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerTitle, setPlayerTitle] = useState('');
  const [playerUrl, setPlayerUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const unsub = subscribePlayer(
      (p) => { setPlayerOpen(true); setPlayerTitle(p.title); setPlayerUrl(p.url); },
      () => { setPlayerOpen(false); setPlayerTitle(''); setPlayerUrl(''); }
    );
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    if (playerOpen && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [playerOpen, playerUrl]);

  useEffect(() => {
    if (!isMilestones) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const unsub = subscribeMilestonesScroll((dx) => {
      try {
        scroller.scrollBy({ left: dx, behavior: 'auto' });
      } catch {}
    });
    return () => { unsub(); };
  }, [isMilestones]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black' }}>
      <div className={stylesHero.slide} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <img className={stylesHero.image} src={baseSlide.img} alt={baseSlide.title} />
        <div className={stylesHero.details}>
          <div className={stylesHero.title}>{baseSlide.title}</div>
          <div className={stylesHero.synopsis}>{baseSlide.synopsis}</div>
          <div className={stylesHero.buttons}>
            <Button label='Play' filled Icon={Play} onClick={onPlay} />
            <Button label='More Info' Icon={Info} onClick={() => window.open('/browse', '_blank')} />
            <Button label='Read' Icon={Book} onClick={() => window.open('/arsip-gallery', '_blank')} />
          </div>
        </div>
      </div>

      {overlaySlide && (
        <div className={stylesHero.slide} style={{ position: 'absolute', inset: 0, opacity: fadeOpacity, transition: 'opacity 600ms ease-in-out' }}>
          <img className={stylesHero.image} src={overlaySlide.img} alt={overlaySlide.title} />
          <div className={stylesHero.details}>
            <div className={stylesHero.title}>{overlaySlide.title}</div>
            <div className={stylesHero.synopsis}>{overlaySlide.synopsis}</div>
            <div className={stylesHero.buttons}>
              <Button label='Play' filled Icon={Play} onClick={onPlay} />
              <Button label='More Info' Icon={Info} onClick={() => window.open('/browse', '_blank')} />
              <Button label='Read' Icon={Book} onClick={() => window.open('/arsip-gallery', '_blank')} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 