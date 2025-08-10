/* eslint-disable @next/next/no-img-element */
import dynamic from 'next/dynamic';
import React, { useContext } from 'react';

import { ModalContext } from '../context/ModalContext';
import styles from '../styles/Browse.module.scss';

const MovieCarouselRow = dynamic(import('../components/MovieCarousel/Row'));
const Modal = dynamic(import('../components/Modal'));
const Layout = dynamic(import('../components/Layout'));
const Hero = dynamic(import('../components/Hero'));

export default function Browse(props: { setGlobalDragging?: (d: boolean) => void }): React.ReactElement {
  const { isModal } = useContext(ModalContext);
  return (
    <>
      {isModal && <Modal />}
      <Layout>
        <div className={styles.offset20}>
          <Hero />
          <div className={styles.contentContainer}>
            <section id='movies'>
              <MovieCarouselRow />
            </section>
          </div>
        </div>
      </Layout>
    </>
  );
}
