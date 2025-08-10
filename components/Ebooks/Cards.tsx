/* eslint-disable @next/next/no-img-element */
import React, { useContext, useRef } from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/Cards.module.scss';
import { Ebook, Genre } from '../../types';
import { ReaderContext } from '../../context/ReaderContext';
import { Add, Like, Dislike, Book } from '../../utils/icons';
import { HoverContext } from '../../context/HoverContext';
import { useDragContext } from '../../context/DragContext';
import { FeaturedContext } from '../../context/FeaturedContext';

const Button = dynamic(import('../Button'));

export default function EbookCards({ item }: { item: Ebook }) {
  const { open: openReader } = useContext(ReaderContext);
  const { open, close } = useContext(HoverContext);
  const { isDragging } = useDragContext();
  const { setFeatured, setSelected, selectedMedia, selectedKey } = useContext(FeaturedContext);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const preview = (
    <div className={styles.card}>
      <img src={item.banner} alt='img' className={styles.cardPoster} />
      <div className={styles.cardInfo}>
        <div className={styles.actionRow}>
          <div className={styles.actionRow}>
            <Button Icon={Book} rounded filled onClick={() => openReader(item)} />
            <Button Icon={Add} rounded />
            <Button Icon={Like} rounded />
            <Button Icon={Dislike} rounded />
          </div>
        </div>
        <div className={styles.textDetails}>
          <strong>{item.title}</strong>
          <div className={styles.row}>
            <span className={styles.greenText}>{`${Math.round(item.rating * 20)}% match`}</span>
          </div>
          {renderGenre(item.genre)}
        </div>
      </div>
    </div>
  );

  const onMouseEnter = () => {
    if (!cardRef.current || isDragging) return;
    const rect = cardRef.current.getBoundingClientRect();
    setFeatured(item as any);
    open(preview, rect);
  };

  const onMouseLeave = () => { close(); setFeatured(null); };

  const onSelect = () => {
    const row = cardRef.current?.closest('[data-row]') as HTMLElement | null;
    const rowKey = row?.getAttribute('data-row') || 'row';
    setSelected(item as any, `${rowKey}:${item.id}`);
  };

  const isSelected = selectedMedia?.id === (item as any).id && selectedKey?.startsWith((cardRef.current?.closest('[data-row]') as HTMLElement | null)?.getAttribute('data-row') || '');

  return (
    <div ref={cardRef} className={`${styles.card} ${isSelected ? styles.selected : ''}`} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onSelect}>
      <img src={item.banner} alt='img' className={styles.cardPoster} />
      <div className={styles.cardInfo}>
        <div className={styles.actionRow}>
          <div className={styles.actionRow}>
            <Button Icon={Book} rounded filled onClick={() => openReader(item)} />
            <Button Icon={Add} rounded />
            <Button Icon={Like} rounded />
            <Button Icon={Dislike} rounded />
          </div>
        </div>
        <div className={styles.textDetails}>
          <strong>{item.title}</strong>
          <div className={styles.row}>
            <span className={styles.greenText}>{`${Math.round(item.rating * 20)}% match`}</span>
          </div>
          {renderGenre(item.genre)}
        </div>
      </div>
    </div>
  );
}

function renderGenre(genre: Genre[]) {
  return (
    <div className={styles.row}>
      {genre.map((g, index) => {
        const isLast = index === genre.length - 1;
        return (
          <div key={g.id} className={styles.row}>
            <span className={styles.regularText}>{g.name}</span>
            {!isLast && <div className={styles.dot}>&bull;</div>}
          </div>
        );
      })}
    </div>
  );
} 