/* eslint-disable @next/next/no-img-element */
import dynamic from 'next/dynamic';
import React, { useContext } from 'react';

import { ModalContext } from '../context/ModalContext';
import styles from '../styles/Browse.module.scss';

const Modal = dynamic(import('../components/Modal'));
const Layout = dynamic(import('../components/Layout'));
const Timeline = dynamic(import('../components/Timeline'));

export default function MilestonesPage(): React.ReactElement {
  const { isModal } = useContext(ModalContext);
  return (
    <>
      {isModal && <Modal />}
      <Layout>
        <div style={{ height: '1rem' }} />
        <div className={styles.contentContainer} style={{ marginTop: '-7vh' }}>
          <section id='milestones'>
            <Timeline />
          </section>
        </div>
      </Layout>
    </>
  );
} 