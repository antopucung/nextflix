import React, { createContext, useContext } from 'react';

export const DragContext = createContext<{ isDragging: boolean }>({ isDragging: false });

export function useDragContext() {
  return useContext(DragContext);
} 