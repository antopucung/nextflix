/* eslint-disable @next/next/no-img-element */
import dynamic from 'next/dynamic';
import React, { useContext, useEffect, useRef } from 'react';

import { ModalContext } from '../context/ModalContext';
import styles from '../styles/Browse.module.scss';
import { useRouter } from 'next/router';
import { subscribeReader, ReaderCloseReason } from '../utils/heroSync';

const Modal = dynamic(import('../components/Modal'));
const Layout = dynamic(import('../components/Layout'));
const EbooksCarouselRow = dynamic(import('../components/EbooksCarousel/Row'));

export default function EbooksPage(props: { setGlobalDragging?: (d: boolean) => void }): React.ReactElement {
  const { isModal } = useContext(ModalContext);
  const { setGlobalDragging } = props;
  const router = useRouter();
  const prevWasOpenRef = useRef<boolean>(false);
  const pageIdleTimerRef = useRef<number | null>(null);

  // Remove overflow lock to allow natural bounce effect
  useEffect(() => {
    return () => {};
  }, []);

  // Listen for reader open/close to detect auto-close
  useEffect(() => {
    let isOpen = false;
    const unsub = subscribeReader(
      () => {
        isOpen = true;
      },
      (reason?: ReaderCloseReason) => {
        const wasOpen = prevWasOpenRef.current || isOpen;
        // Only redirect if it was an auto close
        if (wasOpen && reason === 'auto') {
          router.replace('/browse');
        }
        prevWasOpenRef.current = false;
        isOpen = false;
      }
    );
    return () => {
      unsub();
    };
  }, [router]);

  // Page-level idle: if no activity for 60s (and no reader open), go back to movie page
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
        <div
          className={styles.contentContainer}
          style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
          <div style={{ height: 16, flex: '0 0 auto' }} />

          {/* Modify the offset as per the limit for Arsip A */}
          <section style={{ flex: 1, display: 'flex' }}>
            <EbooksCarouselRow heading='Asia Raya' offset={8} limit={5} />
          </section>

          <section style={{ flex: 1, display: 'flex' }}>
            <EbooksCarouselRow heading='29 Mei 1945' offset={2} limit={2} />
          </section>

          <section style={{ flex: 1, display: 'flex' }}>
            <EbooksCarouselRow heading='30 Mei 1945' offset={4} limit={1} />
          </section>

          <section style={{ flex: 1, display: 'flex' }}>
            <EbooksCarouselRow heading='31 Mei 1945' offset={5} limit={3} />
          </section>

          <section style={{ flex: 1, display: 'flex' }}>
            <EbooksCarouselRow heading='1 Juni 1945' offset={0} limit={2} />
          </section>

          <section style={{ flex: 1, display: 'flex' }}>
            <EbooksCarouselRow heading='Pengantar Arsip' offset={13} limit={1} />
          </section>

          <section style={{ flex: 1, display: 'flex' }}>
            <EbooksCarouselRow heading='Pra Sidang' offset={14} limit={1} />
          </section>

          <div style={{ height: 16, flex: '0 0 auto' }} />
        </div>
      </Layout>
    </>
  );
}
