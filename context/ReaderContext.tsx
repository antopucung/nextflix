import React, { createContext, useCallback, useMemo, useState } from 'react';
import { Ebook } from '../types';

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
  }, []);

  const open = useCallback((e: Ebook) => {
    setEbook(e);
    setIsOpen(true);
  }, []);

  const value = useMemo(() => ({ isOpen, ebook, open, close }), [isOpen, ebook, open, close]);

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
} 