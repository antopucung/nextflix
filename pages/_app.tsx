/* eslint-disable @next/next/no-img-element */
import Head from 'next/head';
import '../styles/globals.scss';
import type { AppProps } from 'next/app';
import { ModalProvider } from '../context/ModalContext';
import { PlayerProvider } from '../context/PlayerContext';
import dynamic from 'next/dynamic';
import { ReaderProvider } from '../context/ReaderContext';
import { HoverProvider } from '../context/HoverContext';
import { DragContext } from '../context/DragContext';
import React, { useMemo, useState, useEffect } from 'react';
import PageTransition from '../components/PageTransition';
import layout from '../styles/Layout.module.scss';
import useScrollLimit from '../hooks/useScrollLimit';
import { FeaturedProvider } from '../context/FeaturedContext';
import { useRouter } from 'next/router';
import { publishRoute } from '../utils/heroSync';

const Player = dynamic(import('../components/Player'));
const Reader = dynamic(import('../components/Reader'));
const HoverPreview = dynamic(import('../components/HoverPreview'));
const PageDragScroll = dynamic(import('../components/PageDragScroll'));
const Navbar = dynamic(import('../components/Navbar'));
const Footer = dynamic(import('../components/Footer'));

const SCROLL_LIMIT = 80;

function App({ Component, pageProps }: AppProps & { pageProps: any }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragValue = useMemo(() => ({ isDragging }), [isDragging]);
  const isScrolled: boolean = useScrollLimit(SCROLL_LIMIT);
  const router = useRouter();
  const isPreview = router.pathname === '/preview';
  const isSecondReader = router.pathname === '/second/reader';

  useEffect(() => {
    publishRoute(router.pathname);
  }, [router.pathname]);

  return (
    <>      
      <Head>
        <title>Nextflix</title>
        <meta name='description' content='Netflix clone, made using Next.js' />
        <link rel='icon' href='/assets/logo-anri.jpg' />
      </Head>
      <PlayerProvider>
        <ReaderProvider>
          <HoverProvider>
            <DragContext.Provider value={dragValue}>
              <ModalProvider>
                <FeaturedProvider>
                  <div className={layout.container}>
                    {!isPreview && !isSecondReader && <Navbar isScrolled={isScrolled} />}
                    <div className={layout.inner}>
                      <PageTransition>
                        <Component {...pageProps} setGlobalDragging={setIsDragging} />
                      </PageTransition>
                    </div>
                    {!isPreview && !isSecondReader && <Footer />}
                  </div>
                  {!isPreview && !isSecondReader && <Player />}
                  {!isPreview && !isSecondReader && <Reader />}
                  {!isPreview && !isSecondReader && <HoverPreview />}
                  {!isPreview && !isSecondReader && <PageDragScroll />}
                </FeaturedProvider>
              </ModalProvider>
            </DragContext.Provider>
          </HoverProvider>
        </ReaderProvider>
      </PlayerProvider>
    </>
  );
}
export default App;
