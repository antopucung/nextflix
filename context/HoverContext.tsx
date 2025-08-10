import React, { createContext, useCallback, useMemo, useState } from 'react';

export type HoverContextValue = {
  isOpen: boolean;
  content: React.ReactNode | null;
  rect: DOMRect | null;
  open: (content: React.ReactNode, rect: DOMRect) => void;
  close: () => void;
};

export const HoverContext = createContext<HoverContextValue>({} as HoverContextValue);

export function HoverProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    setContent(null);
    setRect(null);
  }, []);

  const open = useCallback((node: React.ReactNode, r: DOMRect) => {
    setContent(node);
    setRect(r);
    setIsOpen(true);
  }, []);

  const value = useMemo(() => ({ isOpen, content, rect, open, close }), [isOpen, content, rect, open, close]);

  return <HoverContext.Provider value={value}>{children}</HoverContext.Provider>;
} 