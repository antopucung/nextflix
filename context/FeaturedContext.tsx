import React, { createContext, useCallback, useMemo, useState } from 'react';
import type { Media, HeroSlide } from '../types';

export type FeaturedContextValue = {
  featured: Media | null; // transient hover (not used for hero now)
  selectedMedia: Media | null; // locked selection media
  selectedKey: string | null; // unique UI instance key
  candidates: Media[]; // aggregated items from rows for screensaver
  isScreensaverPaused: boolean; // pause when user interacting or video playing
  lastActivityAt: number; // timestamp for idle detection
  globalSearch: string; // global search query
  setGlobalSearch: (q: string) => void;
  currentSlide: HeroSlide | null; // current hero slide for mirroring (preview)
  setCurrentSlide: (s: HeroSlide | null) => void;
  setFeatured: (m: Media | null) => void;
  setSelected: (m: Media | null, key?: string | null) => void;
  registerRowItems: (rowKey: string, items: Media[]) => void;
  clearRowItems: (rowKey: string) => void;
  setScreensaverPaused: (p: boolean) => void;
  markActivity: () => void;
};

export const FeaturedContext = createContext<FeaturedContextValue>({} as FeaturedContextValue);

export function FeaturedProvider({ children }: { children: React.ReactNode }) {
  const [featured, setFeaturedState] = useState<Media | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [rowMap, setRowMap] = useState<Map<string, Media[]>>(new Map());
  const [isScreensaverPaused, setScreensaverPaused] = useState<boolean>(false);
  const [lastActivityAt, setLastActivityAt] = useState<number>(() => Date.now());
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState<HeroSlide | null>(null);

  const setFeatured = useCallback((m: Media | null) => setFeaturedState(m), []);
  const setSelected = useCallback((m: Media | null, key?: string | null) => {
    setSelectedMedia(m);
    setSelectedKey(key ?? null);
  }, []);

  const registerRowItems = useCallback((rowKey: string, items: Media[]) => {
    setRowMap((prev) => {
      const next = new Map(prev);
      next.set(rowKey, items);
      return next;
    });
  }, []);

  const clearRowItems = useCallback((rowKey: string) => {
    setRowMap((prev) => {
      const next = new Map(prev);
      next.delete(rowKey);
      return next;
    });
  }, []);

  const candidates = useMemo(() => {
    const seen = new Set<number>();
    const flat: Media[] = [];
    rowMap.forEach((arr) => {
      for (let i = 0; i < arr.length; i += 1) {
        const m = arr[i];
        if (!seen.has(m.id)) {
          seen.add(m.id);
          flat.push(m);
        }
      }
    });
    return flat;
  }, [rowMap]);

  const markActivity = useCallback(() => setLastActivityAt(Date.now()), []);

  const value = useMemo(
    () => ({ featured, selectedMedia, selectedKey, candidates, isScreensaverPaused, lastActivityAt, globalSearch, setGlobalSearch, currentSlide, setCurrentSlide, setFeatured, setSelected, registerRowItems, clearRowItems, setScreensaverPaused, markActivity }),
    [featured, selectedMedia, selectedKey, candidates, isScreensaverPaused, lastActivityAt, globalSearch, currentSlide, setFeatured, setSelected, registerRowItems, clearRowItems, setScreensaverPaused, markActivity]
  );

  return <FeaturedContext.Provider value={value}>{children}</FeaturedContext.Provider>;
} 