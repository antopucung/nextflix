/* eslint-disable @next/next/no-img-element */
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useMemo, useRef, useEffect } from 'react';

import useDimensions from '../../hooks/useDimensions';
import styles from '../../styles/Navbar.module.scss';
import { Monitor } from '../../utils/icons';

const SearchBar = dynamic(import('./SearchBar'));
const Menu = dynamic(import('./Menu'));

interface NavbarProps {
  isScrolled: boolean;
}

export default function Navbar({ isScrolled }: NavbarProps): React.ReactElement {
  const navBackground = isScrolled ? styles.navBar__filled : styles.navBar;
  const { isMobile } = useDimensions();
  const router = useRouter();
  const active = useMemo(() => {
    if (router.pathname === '/ebooks') return 'ebooks';
    if (router.pathname === '/milestones') return 'milestones';
    return 'movies';
  }, [router.pathname]);

  const go = (path: string) => {
    if (router.pathname !== path) router.push(path);
  };

  // Second-screen preview window handle
  const previewWin = useRef<Window | null>(null);
  const openPreview = () => {
    const routeQuery = active === 'milestones' ? '?milestones' : '';
    const targetUrl = `/preview${routeQuery}`;
    const features = 'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no';
    if (!previewWin.current || previewWin.current.closed) {
      const w = window.open('about:blank', 'NextflixPreview', features);
      if (w) {
        previewWin.current = w;
        try {
          const bootstrap = `<!doctype html><html><head><meta charset=\"utf-8\"><title>Preview</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"></head><body style=\"margin:0;background:black;overflow:hidden\"><script>(function(){var d=document;var el=d.documentElement;var go=function(){try{if(el.requestFullscreen){el.requestFullscreen().catch(function(){})}}catch(e){} }; go(); setTimeout(function(){ location.replace('${targetUrl}'); }, 20);})();<\/script></body></html>`;
          w.document.open();
          w.document.write(bootstrap);
          w.document.close();
        } catch (e) {
          // fallback: navigate directly
          w.location.href = targetUrl;
        }
      }
    } else {
      try {
        previewWin.current.document.documentElement.requestFullscreen?.();
      } catch {}
      previewWin.current.location.href = targetUrl;
      previewWin.current.focus();
    }
  };
  useEffect(() => () => { if (previewWin.current && !previewWin.current.closed) previewWin.current.close(); }, []);

  return (
    <motion.div
      className={navBackground}
      initial='hidden'
      animate='visible'
      exit='hidden'
      variants={{
        hidden: { opacity: 0, transition: { duration: 0.2 } },
        visible: { opacity: 1, transition: { duration: 0.2 } }
      }}>
      <div className={styles.navBar__left}>
        <Menu />
        {!isMobile && (
          <div style={{ display: 'flex', marginLeft: '1rem' }}>
            <div className={`${styles.options} ${active === 'movies' ? 'active' : ''}`} onClick={() => go('/browse')}>Film</div>
            <div className={`${styles.options} ${active === 'ebooks' ? 'active' : ''}`} onClick={() => go('/ebooks')}>Arsip</div>
            <div className={`${styles.options} ${active === 'milestones' ? 'active' : ''}`} onClick={() => go('/milestones')}>Lini Masa</div>
          </div>
        )}
      </div>

      {/* <div className={styles.navBar__right}>
        <SearchBar />
        <button className={styles.icon} aria-label='Open preview' title='Open preview (Second Screen)'
          onClick={openPreview} style={{ zIndex: 9999, background: 'transparent', border: 'none', cursor: 'pointer' }}>
          <Monitor />
        </button>
      </div> */}
    </motion.div>
  );
}
