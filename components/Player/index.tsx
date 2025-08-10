/* eslint-disable @next/next/no-img-element */
import React, { useContext, useRef, useEffect } from 'react';
import styles from '../../styles/Player.module.scss';
import { PlayerContext } from '../../context/PlayerContext';
import { FeaturedContext } from '../../context/FeaturedContext';

export default function Player() {
  const { isPlaying, videoUrl, currentMedia, stop } = useContext(PlayerContext);
  const { setScreensaverPaused, markActivity } = useContext(FeaturedContext);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (isPlaying && videoRef.current) {
      markActivity();
      setScreensaverPaused(true);
      videoRef.current.play().catch(() => {});
    }
  }, [isPlaying, videoUrl, markActivity, setScreensaverPaused]);

  if (!isPlaying || !videoUrl) return null;

  const onEnded = () => {
    stop();
    // after video ends, resume screensaver after 5 seconds unless user acts
    setTimeout(() => setScreensaverPaused(false), 5000);
    markActivity();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <div className={styles.title}>{currentMedia?.title}</div>
        <button className={styles.close} onClick={() => { stop(); setScreensaverPaused(false); markActivity(); }}>×</button>
      </div>
      <video ref={videoRef} className={styles.video} src={videoUrl} controls playsInline onEnded={onEnded} />
    </div>
  );
} 