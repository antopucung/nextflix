/* eslint-disable @next/next/no-img-element */
import React, { useContext, useState } from 'react';
import styles from '../../styles/EbooksCarousel.module.scss';
import type { Ebook } from '../../types';
import { ReaderContext } from '../../context/ReaderContext';
import { Book } from '../../utils/icons';

type Props = { ebook: Ebook | null; fallback?: Ebook | null };

export default function EbookCard({ ebook, fallback }: Props): React.ReactElement {
  const { open: openReader } = useContext(ReaderContext);
  const target = ebook || fallback || null;
  const [loaded, setLoaded] = useState(false);

  const onOpen = () => {
    if (!target) return;
    openReader(target);
  };

  return (
    <div
      className={`${styles.card} ${!ebook ? styles.placeholder : ''} ${loaded ? styles.loaded : ''}`}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(); }}
    >
      <img
        className={styles.poster}
        src={target?.banner || '/assets/placeholder.jpg'}
        alt={target?.title || 'Arsip'}
        loading="lazy"
        decoding="async"
        sizes="(min-width: 1200px) 18vw, (min-width: 768px) 30vw, 50vw"
        onLoad={() => setLoaded(true)}
      />
      <div className={styles.overlay}>
        <div className={styles.title}>{target?.title || 'Arsip'}</div>
        <button className={styles.readBtn} aria-label="Read" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          <Book />
        </button>
      </div>
    </div>
  );
} 