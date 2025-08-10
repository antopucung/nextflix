/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useState, useContext } from 'react';
import axios from 'axios';
import styles from '../../styles/MovieCarousel.module.scss';
import type { Media } from '../../types';
import MovieCard from './Card';
import { useRouter } from 'next/router';
import { FeaturedContext } from '../../context/FeaturedContext';

export default function MovieCarouselRow(): React.ReactElement {
  const [movies, setMovies] = useState<Media[]>([]);
  const router = useRouter();
  const { registerRowItems, clearRowItems } = useContext(FeaturedContext);

  useEffect(() => {
    axios.get('/api/popular?type=movie').then((res) => {
      const data: Media[] = res.data.data || [];
      setMovies(data);
      registerRowItems('movie-main', data);
    });
    return () => clearRowItems('movie-main');
  }, [registerRowItems, clearRowItems]);

  const firstFour = useMemo(() => movies.slice(0, 4), [movies]);

  return (
    <div className={styles.container}>
      <div className={styles.deck}>
        {firstFour.map((m, i) => (
          <MovieCard key={`mv-${m.id}-${i}`} item={m} index={i} rowKey='movie-main' />
        ))}
        <div className={`${styles.card} ${styles.linkCard}`} role='link' tabIndex={0}
             onClick={() => router.push('/milestones')}
             onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push('/milestones'); }}>
          <img className={styles.poster} src={firstFour[0]?.banner || '/assets/placeholder.jpg'} alt='Lini Masa' />
          <div className={styles.overlay}><div className={styles.title}>Lini Masa</div></div>
        </div>
        <div className={`${styles.card} ${styles.linkCard}`} role='link' tabIndex={0}
             onClick={() => router.push('/ebooks')}
             onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push('/ebooks'); }}>
          <img className={styles.poster} src={firstFour[1]?.banner || '/assets/placeholder.jpg'} alt='Arsip' />
          <div className={styles.overlay}><div className={styles.title}>Arsip</div></div>
        </div>
      </div>
    </div>
  );
} 