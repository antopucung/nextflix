/* eslint-disable @next/next/no-img-element */
import React, { useContext } from 'react';
import styles from '../../styles/MovieCarousel.module.scss';
import type { Media } from '../../types';
import { PlayerContext } from '../../context/PlayerContext';
import { ModalContext } from '../../context/ModalContext';
import { FeaturedContext } from '../../context/FeaturedContext';
import { Play, Info } from '../../utils/icons';

export default function MovieCard({ item, index, rowKey }: { item: Media; index: number; rowKey: string }): React.ReactElement {
  const { play } = useContext(PlayerContext);
  const { setModalData, setIsModal } = useContext(ModalContext);
  const { setFeatured, setSelected } = useContext(FeaturedContext);

  const onPlay = () => play(item);
  const onInfo = () => { setModalData(item); setIsModal(true); };
  const onSelect = () => { setFeatured(item); setSelected(item, `${rowKey}:${item.id}`); };

  return (
    <div className={styles.card} onClick={onSelect} role="button" tabIndex={0}
         onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}>
      <img className={styles.poster} src={item.banner || item.poster} alt={item.title} loading="lazy" decoding="async" />
      <div className={styles.overlay}>
        <div className={styles.title}>{item.title}</div>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={(e) => { e.stopPropagation(); onPlay(); }} aria-label="Play"><Play /></button>
          <button className={styles.btn} onClick={(e) => { e.stopPropagation(); onInfo(); }} aria-label="Info"><Info /></button>
        </div>
      </div>
    </div>
  );
} 