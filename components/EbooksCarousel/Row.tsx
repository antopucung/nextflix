/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import type { Ebook } from '../../types';
import styles from '../../styles/EbooksCarousel.module.scss';
import EbookCard from './Card';

type Props = {
  heading: string;
  offset: number;
  limit?: number;
};

export default function EbooksCarouselRow({ heading, offset, limit = 5 }: Props): React.ReactElement {
  const [data, setData] = useState<Ebook[]>([]);

  useEffect(() => {
    axios.get('/api/ebooks').then((res) => setData(res.data.data || []));
  }, []);

  const items: (Ebook | null)[] = useMemo(() => {
    const n = data.length;
    const count = limit;
    const start = n > 0 ? ((offset % n) + n) % n : 0;
    const out: (Ebook | null)[] = [];
    for (let i = 0; i < count; i++) {
      out.push(n ? data[(start + i) % n] : null);
    }
    return out;
  }, [data, offset, limit]);

  const fallback: Ebook | null = useMemo(() => (data.length ? data[0] : null), [data]);

  return (
    <div className={styles.row}>
      <div className={styles.heading}>{heading}</div>
      <div className={styles.deck}>
        {items.map((ebook, i) => (
          <EbookCard key={`ec-${heading}-${i}`} ebook={ebook} fallback={fallback} />
        ))}
      </div>
    </div>
  );
} 