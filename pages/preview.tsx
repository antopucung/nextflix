/* eslint-disable @next/next/no-img-element */
import React, { useContext, useMemo, useEffect, useState, useRef } from 'react';
import { FeaturedContext } from '../context/FeaturedContext';
import { PlayerContext } from '../context/PlayerContext';
import stylesHero from '../styles/Hero.module.scss';
import stylesTimeline from '../styles/Timeline.module.scss';
import Button from '../components/Button';
import { Play, Info, Book } from '../utils/icons';
import type { HeroSlide, Media } from '../types';
import { subscribeHeroSlide, subscribeScreensaver, subscribeMilestonesState, MilestonePayload, subscribeRoute } from '../utils/heroSync';
import { useRouter } from 'next/router';

function toMedia(s: HeroSlide): Media {
  return { id: s.id, title: s.title, overview: s.synopsis, poster: s.img, banner: s.img, rating: 4.5, genre: [] } as Media;
}

export default function Preview(): React.ReactElement {
  const router = useRouter();
  const [forceMilestones, setForceMilestones] = useState<boolean>(false);
  const isMilestones = forceMilestones || router.query?.route === 'milestones' || (typeof window !== 'undefined' && window.location.search.includes('milestones'));

  // Follow main route automatically
  useEffect(() => {
    const unsub = subscribeRoute((pathname) => {
      if (pathname === '/milestones') setForceMilestones(true);
      else setForceMilestones(false);
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

  const slide: HeroSlide = useMemo(() => {
    if (currentSlide) return currentSlide;
    if (selectedMedia) return { id: selectedMedia.id, img: selectedMedia.banner || selectedMedia.poster, title: selectedMedia.title, synopsis: selectedMedia.overview };
    if (candidates.length > 0) {
      const m = candidates[0];
      return { id: m.id, img: m.banner || m.poster, title: m.title, synopsis: m.overview };
    }
    return { id: 0, img: '/content/hero/slide-1.jpg', title: 'Preview', synopsis: '' };
  }, [currentSlide, selectedMedia, candidates]);

  const onPlay = () => play(toMedia(slide));

  // Milestones mirroring (full-screen centered carousel without header)
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [msItems, setMsItems] = useState<MilestonePayload[]>([]);
  const [msIndex, setMsIndex] = useState<number>(0);

  useEffect(() => {
    const unsub = subscribeMilestonesState((items, index) => {
      setMsItems(items);
      setMsIndex(index);
      if (items && items.length > 0) setForceMilestones(true);
      // center to index on update
      requestAnimationFrame(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        const cards = Array.from(scroller.querySelectorAll(`.${stylesTimeline.card}`)) as HTMLElement[];
        if (!cards.length) return;
        const clamped = ((index % cards.length) + cards.length) % cards.length;
        const target = cards[clamped].offsetLeft + cards[clamped].offsetWidth / 2 - scroller.clientWidth / 2;
        scroller.scrollTo({ left: target, behavior: 'smooth' });
      });
    });
    return () => { unsub(); };
  }, []);

  if (isMilestones) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'black', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div id='milestones' style={{ width: '100%', height: '100%' }}>
          <div className={stylesTimeline.scroller} ref={scrollerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className={stylesTimeline.row} style={{ justifyContent: 'center', alignItems: 'center' }}>
              {msItems.map((m, i) => (
                <div key={`m-prev-${i}`} className={stylesTimeline.card}>
                  <img className={stylesTimeline.image} src={m.banner} alt={m.title} />
                  <div className={stylesTimeline.meta}>
                    <div className={stylesTimeline.title}>{m.title}</div>
                    <div className={stylesTimeline.overview}>{m.overview}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', overflow: 'hidden' }}>
      <div className={stylesHero.scroller} style={{ width: '100%', height: '100%' }}>
        <div className={stylesHero.slide}>
          <img className={stylesHero.image} src={slide.img} alt={slide.title} />
          <div className={stylesHero.details}>
            <div className={stylesHero.title}>{slide.title}</div>
            <div className={stylesHero.synopsis}>{slide.synopsis}</div>
            <div className={stylesHero.buttons}>
              <Button label='Play' filled Icon={Play} onClick={onPlay} />
              <Button label='More Info' Icon={Info} onClick={() => window.open('/browse', '_blank')} />
              <Button label='Read' Icon={Book} onClick={() => window.open('/ebooks', '_blank')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 