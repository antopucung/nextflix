/* eslint-disable @next/next/no-img-element */
import { useContext, useRef } from 'react';
import dynamic from 'next/dynamic';

import { Genre, Media } from '../../types';
import styles from '../../styles/Cards.module.scss';
import { ModalContext } from '../../context/ModalContext';
import { Add, Play, Down, Like, Dislike } from '../../utils/icons';
import { PlayerContext } from '../../context/PlayerContext';
import { HoverContext } from '../../context/HoverContext';
import { useDragContext } from '../../context/DragContext';
import { FeaturedContext } from '../../context/FeaturedContext';

const Button = dynamic(import('../Button'));

interface CardsProps {
  defaultCard?: boolean;
  item: Media;
}

export default function Cards({ defaultCard = true, item }: CardsProps): React.ReactElement {
  const style = defaultCard ? styles.card : styles.longCard;
  const infoStyle = defaultCard ? styles.cardInfo : styles.more;
  const { title, poster, banner, rating, genre } = item;
  const image = defaultCard ? banner : poster;

  const { setModalData, setIsModal } = useContext(ModalContext);
  const { play } = useContext(PlayerContext);
  const { open, close } = useContext(HoverContext);
  const { isDragging } = useDragContext();
  const { setFeatured, setSelected, selected, selectedKey } = useContext(FeaturedContext);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const onClick = (data: Media) => {
    setModalData(data);
    setIsModal(true);
  };

  const onPlay = (data: Media) => {
    play(data);
  };

  const onSelect = () => {
    const row = cardRef.current?.closest('[data-row]') as HTMLElement | null;
    const rowKey = row?.getAttribute('data-row') || 'row';
    setSelected(item, `${rowKey}:${item.id}`);
  };

  const preview = (
    <div className={style}>
      <img src={image} alt='img' className={styles.cardPoster} />
      <div className={infoStyle}>
        <div className={styles.actionRow}>
          <div className={styles.actionRow}>
            <Button Icon={Play} rounded filled onClick={() => onPlay(item)} />
            <Button Icon={Add} rounded />
            {defaultCard && (
              <>
                <Button Icon={Like} rounded />
                <Button Icon={Dislike} rounded />
              </>
            )}
          </div>
          <Button Icon={Down} rounded onClick={() => onClick(item)} />
        </div>
        <div className={styles.textDetails}>
          <strong>{title}</strong>
          <div className={styles.row}>
            <span className={styles.greenText}>{`${rating * 10}% match`}</span>
          </div>
          {renderGenre(genre)}
        </div>
      </div>
    </div>
  );

  const onMouseEnter = () => {
    if (!cardRef.current || isDragging) return;
    const rect = cardRef.current.getBoundingClientRect();
    setFeatured(item); // update hero
    open(preview, rect);
  };

  const onMouseLeave = () => {
    close();
    setFeatured(null); // reset hero
  };

  const isSelected = selected?.id === item.id && selectedKey?.startsWith((cardRef.current?.closest('[data-row]') as HTMLElement | null)?.getAttribute('data-row') || '');

  return (
    <div
      ref={cardRef}
      className={`${style} ${isSelected ? styles.selected : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSelect}
    >
      <img src={image} alt='img' className={styles.cardPoster} />
      <div className={infoStyle}>
        <div className={styles.actionRow}>
          <div className={styles.actionRow}>
            <Button Icon={Play} rounded filled onClick={() => onPlay(item)} />
            <Button Icon={Add} rounded />
            {defaultCard && (
              <>
                <Button Icon={Like} rounded />
                <Button Icon={Dislike} rounded />
              </>
            )}
          </div>
          <Button Icon={Down} rounded onClick={() => onClick(item)} />
        </div>
        <div className={styles.textDetails}>
          <strong>{title}</strong>
          <div className={styles.row}>
            <span className={styles.greenText}>{`${rating * 10}% match`}</span>
          </div>
          {renderGenre(genre)}
        </div>
      </div>
    </div>
  );
}

function renderGenre(genre: Genre[]) {
  return (
    <div className={styles.row}>
      {genre.map((item, index) => {
        const isLast = index === genre.length - 1;
        return (
          <div key={index} className={styles.row}>
            <span className={styles.regularText}>{item.name}</span>
            {!isLast && <div className={styles.dot}>&bull;</div>}
          </div>
        );
      })}
    </div>
  );
}
