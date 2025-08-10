/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

import { Maybe } from '../../types';
import { CaretDown } from '../../utils/icons';
import styles from '../../styles/Navbar.module.scss';
import useDimensions from '../../hooks/useDimensions';

const Dialog = dynamic(import('../Dialog'))

const items = [
  { label: 'Film', path: '/browse' },
  { label: 'Arsip', path: '/ebooks' },
  { label: 'Lini Masa', path: '/milestones' },
  { label: 'LiniMasa2', path: '/BookAnim/index.html', external: true }
];

export default function Menu() {
  const { isMobile, isTablet } = useDimensions();
  const menuRef = useRef<Maybe<HTMLDivElement>>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const router = useRouter();

  const onMenu = (): void => {
    setIsVisible(true);
  };
  const onClose = (): void => {
    setIsVisible(false);
  };

  const caretAnimation = {
    animate: isVisible ? 'up' : 'down',
    variants: {
      up: { rotate: 180 },
      down: { rotate: 0 }
    },
    transition: { duration: 0.25 }
  };

  const go = async (item: { path: string; external?: boolean }) => {
    setIsVisible(false);
    if (item.external) {
      window.open(item.path, '_blank', 'noopener');
      return;
    }
    if (router.pathname !== item.path) await router.push(item.path);
  };

  return (
    <>
      <Image src='/assets/logo-anri.jpg' alt='ANRI' width={120} height={32} className={styles.nfLogo} />
      {isTablet || isMobile ? (
        <>
          <div className={styles.browse}>
            <div className={styles.options} onMouseOver={onMenu}>
              browse
            </div>
            <motion.div {...caretAnimation}>
              <CaretDown />
            </motion.div>
          </div>
          <Dialog dialogRef={menuRef} onClose={onClose} classname={styles.menu} visible={isVisible}>
            {items.map((item, index) => (
              <div key={index} className={styles.options} onClick={() => go(item)}>
                {item.label}
              </div>
            ))}
          </Dialog>
        </>
      ) : (
        <></>
      )}
    </>
  );
}
