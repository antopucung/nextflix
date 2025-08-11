import React, { createContext, useCallback, useMemo, useState, useEffect } from 'react';
import { Ebook } from '../types';
import { publishReaderOpen, publishReaderClose, publishScreensaver, subscribeReader, ReaderPayload } from '../utils/heroSync';
import { ensureSecondWindow, isSecondScreenPresent } from '../utils/secondScreen';

export type ReaderContextValue = {
  isOpen: boolean;
  ebook: Ebook | null;
  open: (ebook: Ebook) => void;
  close: () => void;
  // Gallery support
  galleryUrls: string[];
  galleryIndex: number;
  openWithGallery: (ebook: Ebook, urls: string[], index: number) => void;
  navPrev: () => void;
  navNext: () => void;
};

export const ReaderContext = createContext<ReaderContextValue>({} as ReaderContextValue);

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState<number>(-1);

  const close = useCallback(() => {
    setIsOpen(false);
    setEbook(null);
    setGalleryUrls([]);
    setGalleryIndex(-1);
    publishReaderClose();
    publishScreensaver(false); // resume saver when closing
  }, []);

  const shouldDisableSecondScreen = (): boolean => {
    const onSecondOrPreviewRoute =
      typeof window !== 'undefined' && (window.location.pathname === '/second/reader' || window.location.pathname === '/preview');
    const onEbooksRoute = typeof window !== 'undefined' && (
      window.location.pathname === '/ebooks' ||
      window.location.pathname === '/ebooks2' ||
      window.location.pathname === '/arsip-gallery'
    );
    return onSecondOrPreviewRoute || onEbooksRoute || isSecondScreenPresent();
  };

  const open = useCallback((e: Ebook) => {
    setEbook(e);
    setIsOpen(true);
    setGalleryUrls([]);
    setGalleryIndex(-1);
    publishReaderOpen({ id: e.id, title: e.title, pdfUrl: e.pdfUrl, banner: e.banner });
    publishScreensaver(true); // pause saver while reading
    if (!shouldDisableSecondScreen()) {
      ensureSecondWindow();
    }
  }, []);

  const openWithGallery = useCallback((e: Ebook, urls: string[], index: number) => {
    setEbook(e);
    setIsOpen(true);
    setGalleryUrls(urls || []);
    setGalleryIndex(typeof index === 'number' ? index : 0);
    publishReaderOpen({ id: e.id, title: e.title, pdfUrl: e.pdfUrl, banner: e.banner });
    publishScreensaver(true);
    if (!shouldDisableSecondScreen()) {
      ensureSecondWindow();
    }
  }, []);

  const setFromGallery = useCallback((nextIndex: number) => {
    if (galleryUrls.length === 0) return;
    const n = ((nextIndex % galleryUrls.length) + galleryUrls.length) % galleryUrls.length;
    const url = galleryUrls[n];
    const title = (url.split('/').pop() || 'Gambar').replace(/\.[^/.]+$/, '');
    setGalleryIndex(n);
    setEbook((prev) => ({
      id: Date.now(),
      title,
      overview: prev?.overview || '',
      cover: url,
      banner: url,
      rating: 0,
      genre: [],
      pdfUrl: url,
    }));
    // Optionally mirror to second screen if open
    publishReaderOpen({ id: Date.now(), title, pdfUrl: url, banner: url });
  }, [galleryUrls]);

  const navPrev = useCallback(() => {
    if (galleryUrls.length === 0) return;
    setFromGallery(galleryIndex - 1);
  }, [galleryIndex, galleryUrls.length, setFromGallery]);

  const navNext = useCallback(() => {
    if (galleryUrls.length === 0) return;
    setFromGallery(galleryIndex + 1);
  }, [galleryIndex, galleryUrls.length, setFromGallery]);

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

  const value = useMemo(() => ({ isOpen, ebook, open, close, galleryUrls, galleryIndex, openWithGallery, navPrev, navNext }), [isOpen, ebook, open, close, galleryUrls, galleryIndex, openWithGallery, navPrev, navNext]);

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
} 