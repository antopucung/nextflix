/* eslint-disable @next/next/no-img-element */
import React, { useContext, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { HoverContext } from '../../context/HoverContext';
import styles from '../../styles/HoverPreview.module.scss';

export default function HoverPreview() {
  const { isOpen, content, rect, close } = useContext(HoverContext);

  const style = useMemo(() => {
    if (!rect) return { display: 'none' } as React.CSSProperties;
    const top = rect.top + window.scrollY;
    const left = rect.left + window.scrollX;
    return { top, left, width: rect.width, height: rect.height } as React.CSSProperties;
  }, [rect]);

  useEffect(() => {
    function onScroll() { if (isOpen) close(); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isOpen, close]);

  if (!isOpen || !content || !rect) return null;
  return createPortal(
    <div className={styles.overlay} style={style} onMouseLeave={close}>
      <div className={styles.card}>{content}</div>
    </div>,
    document.body
  );
} 