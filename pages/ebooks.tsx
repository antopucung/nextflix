/* eslint-disable @next/next/no-img-element */
import dynamic from 'next/dynamic';
import React, { useContext } from 'react';

import { ModalContext } from '../context/ModalContext';
import styles from '../styles/Browse.module.scss';

const Modal = dynamic(import('../components/Modal'));
const Layout = dynamic(import('../components/Layout'));
const Hero = dynamic(import('../components/Hero'));
const EbooksRow = dynamic(import('../components/Ebooks'));

export default function EbooksPage(props: { setGlobalDragging?: (d: boolean) => void }): React.ReactElement {
  const { isModal } = useContext(ModalContext);
  const { setGlobalDragging } = props;
  return (
    <>
      {isModal && <Modal />}
      <Layout>
        <Hero />
        <div className={styles.contentContainer}>
          <section id='ebooks'>
            <EbooksRow setGlobalDragging={setGlobalDragging} />
          </section>
        </div>
      </Layout>
    </>
  );
} 