import React, { createContext, useCallback, useMemo, useState, useEffect } from 'react';
import { Ebook } from '../types';
import { publishReaderOpen, publishReaderClose, publishScreensaver, subscribeReader, ReaderPayload } from '../utils/heroSync';
import { ensureSecondWindow, isSecondScreenPresent } from '../utils/secondScreen';

export type ReaderContextValue = {
  isOpen: boolean;
  ebook: Ebook | null;
  open: (ebook: Ebook) => void;
  close: () => void;
};

export const ReaderContext = createContext<ReaderContextValue>({} as ReaderContextValue);

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [ebook, setEbook] = useState<Ebook | null>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    setEbook(null);
    publishReaderClose();
    publishScreensaver(false); // resume saver when closing
  }, []);

  const open = useCallback((e: Ebook) => {
    setEbook(e);
    setIsOpen(true);
    publishReaderOpen({ id: e.id, title: e.title, pdfUrl: e.pdfUrl, banner: e.banner });
    publishScreensaver(true); // pause saver while reading
    // Only try to open the second screen from the primary screen and if none is already present
    const onSecondOrPreviewRoute =
      typeof window !== 'undefined' && (window.location.pathname === '/second/reader' || window.location.pathname === '/preview');
    // Disable second-screen popup on the ebooks/gallery pages (single monitor mode)
    const onEbooksRoute = typeof window !== 'undefined' && (
      window.location.pathname === '/ebooks' ||
      window.location.pathname === '/ebooks2' ||
      window.location.pathname === '/arsip-gallery'
    );
    if (!onSecondOrPreviewRoute && !onEbooksRoute && !isSecondScreenPresent()) {
      // ensureSecondWindow(); // disabled for /ebooks
      ensureSecondWindow();
    }
  }, []);

  // Mirror external open/close commands (from second screen or other tabs)
  useEffect(() => {
    const toEbook = (p: ReaderPayload): Ebook => ({
      id: p.id,
      title: p.title,
      overview: '',
      cover: p.banner || '',
      banner: p.banner || '',
      rating: 0,
      genre: [],
      pdfUrl: p.pdfUrl,
    });
    const unsub = subscribeReader(
      (payload) => {
        setEbook(toEbook(payload));
        setIsOpen(true);
        publishScreensaver(true);
      },
      () => {
        setIsOpen(false);
        setEbook(null);
        publishScreensaver(false);
      }
    );
    return () => { unsub(); };
  }, []);

  const value = useMemo(() => ({ isOpen, ebook, open, close }), [isOpen, ebook, open, close]);

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
} 