/* eslint-disable @next/next/no-img-element */
import dynamic from 'next/dynamic';
import React, { useContext, useEffect, useRef } from 'react';

import { ModalContext } from '../context/ModalContext';
import styles from '../styles/Browse.module.scss';
import { useRouter } from 'next/router';
import { subscribeReader, ReaderCloseReason } from '../utils/heroSync';
import Explorer from '../components/Explorer';

const Modal = dynamic(import('../components/Modal'));
const Layout = dynamic(import('../components/Layout'));

export default function ArsipGalleryPage(props: { setGlobalDragging?: (d: boolean) => void }): React.ReactElement {
  const { isModal } = useContext(ModalContext);
  const { setGlobalDragging } = props;
  const router = useRouter();
  const prevWasOpenRef = useRef<boolean>(false);
  const pageIdleTimerRef = useRef<number | null>(null);

  useEffect(() => { return () => {}; }, []);

  // Hide OS scrollbars on this page (Windows aesthetic)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('hide-scrollbars');
      document.documentElement.classList.add('hide-scrollbars');
      return () => {
        document.body.classList.remove('hide-scrollbars');
        document.documentElement.classList.remove('hide-scrollbars');
      };
    }
  }, []);

  useEffect(() => {
    let isOpen = false;
    const unsub = subscribeReader(
      () => { isOpen = true; },
      (reason?: ReaderCloseReason) => {
        const wasOpen = prevWasOpenRef.current || isOpen;
        if (wasOpen && reason === 'auto') {
          router.replace('/browse');
        }
        prevWasOpenRef.current = false;
        isOpen = false;
      }
    );
    return () => { unsub(); };
  }, [router]);

  useEffect(() => {
    const resetIdle = () => {
      if (pageIdleTimerRef.current) window.clearTimeout(pageIdleTimerRef.current);
      pageIdleTimerRef.current = window.setTimeout(() => {
        router.replace('/browse');
      }, 60000) as unknown as number; // 60s
    };
    resetIdle();
    const onActivity = () => resetIdle();
    document.addEventListener('pointerdown', onActivity, { passive: true });
    document.addEventListener('pointermove', onActivity, { passive: true });
    document.addEventListener('keydown', onActivity);
    document.addEventListener('wheel', onActivity, { passive: true });
    return () => {
      if (pageIdleTimerRef.current) window.clearTimeout(pageIdleTimerRef.current);
      document.removeEventListener('pointerdown', onActivity as any);
      document.removeEventListener('pointermove', onActivity as any);
      document.removeEventListener('keydown', onActivity as any);
      document.removeEventListener('wheel', onActivity as any);
    };
  }, [router]);

  return (
    <>
      {isModal && <Modal />}
      <Layout>
        <div className={styles.contentContainer} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
          <div style={{ height: 16, flex: '0 0 auto' }} />
          <section style={{ flex: 1, display: 'flex' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ color: '#e6e6e6', fontSize: 20, fontWeight: 600, padding: '0 4px 6px' }}>Arsip Gallery</div>
              <Explorer />
            </div>
          </section>
          <div style={{ height: 16, flex: '0 0 auto' }} />
        </div>
      </Layout>
    </>
  );
} 