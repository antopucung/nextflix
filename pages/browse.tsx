/* eslint-disable @next/next/no-img-element */
import dynamic from 'next/dynamic';
import React, { useContext } from 'react';

import { ModalContext } from '../context/ModalContext';
import styles from '../styles/Browse.module.scss';

const List = dynamic(import('../components/List'));
const Modal = dynamic(import('../components/Modal'));
const Layout = dynamic(import('../components/Layout'));
const Hero = dynamic(import('../components/Hero'));

export default function Browse(props: { setGlobalDragging?: (d: boolean) => void }): React.ReactElement {
  const { isModal } = useContext(ModalContext);
  const { setGlobalDragging } = props;
  return (
    <>
      {isModal && <Modal />}
      <Layout>
        <Hero />
        <div className={styles.contentContainer}>
          <section id='movies'>
            <List heading='Popular Movies' endpoint='/api/popular?type=movie' setGlobalDragging={setGlobalDragging} />
          </section>
          <section>
            <List heading='Trending Now' endpoint='/api/trending?type=movie&time=day' setGlobalDragging={setGlobalDragging} />
          </section>
          <section>
            <List heading='Action & Adventure' endpoint='/api/discover?type=movie&genre=28' setGlobalDragging={setGlobalDragging} />
          </section>
        </div>
      </Layout>
    </>
  );
}
