/* eslint-disable @next/next/no-img-element */
import React, { useContext } from 'react';
import styles from '../../styles/Reader.module.scss';
import { ReaderContext } from '../../context/ReaderContext';

export default function Reader() {
  const { isOpen, ebook, close } = useContext(ReaderContext);
  if (!isOpen || !ebook) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <div className={styles.title}>{ebook.title}</div>
        <button className={styles.close} onClick={close}>×</button>
      </div>
      <iframe className={styles.frame} src={ebook.pdfUrl} title={ebook.title} />
    </div>
  );
} 