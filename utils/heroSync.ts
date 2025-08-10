type HeroSlidePayload = { id: number; img: string; title: string; synopsis: string };
export type ReaderPayload = { id: number; title: string; pdfUrl: string; banner?: string };
export type PlayerPayload = { id?: number; title: string; url: string };
export type ReaderScrollPayload = { dy: number; vh?: number };
export type ReaderCloseReason = 'manual' | 'auto' | undefined;

const CHANNEL = 'nextflix-hero-sync';

let bc: BroadcastChannel | null = null;
try {
  bc = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL) : null;
} catch {
  bc = null;
}

export function publishHeroSlide(slide: HeroSlidePayload): void {
  if (bc) {
    bc.postMessage({ type: 'hero', slide });
  } else if (typeof window !== 'undefined') {
    try {
      const key = `${CHANNEL}:hero`;
      const payload = { slide, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {}
  }
}

export function subscribeHeroSlide(onSlide: (slide: HeroSlidePayload) => void): () => void {
  const onMessage = (ev: MessageEvent) => {
    const data = ev.data;
    if (data?.type === 'hero' && data.slide) onSlide(data.slide);
  };

  const onStorage = (ev: StorageEvent) => {
    if (!ev.key || !ev.newValue) return;
    if (ev.key.startsWith(`${CHANNEL}:hero`)) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (parsed?.slide) onSlide(parsed.slide);
      } catch {}
    }
  };

  if (bc) {
    bc.addEventListener('message', onMessage);
    return () => bc && bc.removeEventListener('message', onMessage as any);
  }
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

export function publishScreensaver(pause: boolean): void {
  if (bc) {
    bc.postMessage({ type: 'screensaver', pause });
  } else if (typeof window !== 'undefined') {
    try {
      const key = `${CHANNEL}:screensaver`;
      const payload = { pause, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {}
  }
}

export function subscribeScreensaver(onPause: (pause: boolean) => void): () => void {
  const onMessage = (ev: MessageEvent) => {
    const data = ev.data;
    if (data?.type === 'screensaver') onPause(!!data.pause);
  };

  const onStorage = (ev: StorageEvent) => {
    if (!ev.key || !ev.newValue) return;
    if (ev.key.startsWith(`${CHANNEL}:screensaver`)) {
      try {
        const parsed = JSON.parse(ev.newValue);
        onPause(!!parsed?.pause);
      } catch {}
    }
  };

  if (bc) {
    bc.addEventListener('message', onMessage);
    return () => bc && bc.removeEventListener('message', onMessage as any);
  }
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

// Reader sync
export function publishReaderOpen(ebook: ReaderPayload): void {
  if (bc) {
    bc.postMessage({ type: 'reader', action: 'open', ebook });
  } else if (typeof window !== 'undefined') {
    try {
      const key = `${CHANNEL}:reader`;
      const payload = { action: 'open', ebook, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {}
  }
}

export function publishReaderClose(reason?: ReaderCloseReason): void {
  if (bc) {
    bc.postMessage({ type: 'reader', action: 'close', reason });
  } else if (typeof window !== 'undefined') {
    try {
      const key = `${CHANNEL}:reader`;
      const payload = { action: 'close', reason, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {}
  }
}

export function subscribeReader(onOpen: (ebook: ReaderPayload) => void, onClose: (reason?: ReaderCloseReason) => void): () => void {
  const onMessage = (ev: MessageEvent) => {
    const data = ev.data;
    if (data?.type === 'reader') {
      if (data.action === 'open' && data.ebook) onOpen(data.ebook);
      if (data.action === 'close') onClose(data.reason as ReaderCloseReason);
    }
  };

  const onStorage = (ev: StorageEvent) => {
    if (!ev.key || !ev.newValue) return;
    if (ev.key.startsWith(`${CHANNEL}:reader`)) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (parsed?.action === 'open' && parsed.ebook) onOpen(parsed.ebook);
        if (parsed?.action === 'close') onClose(parsed.reason as ReaderCloseReason);
      } catch {}
    }
  };

  if (bc) {
    bc.addEventListener('message', onMessage);
    return () => bc && bc.removeEventListener('message', onMessage as any);
  }
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

// Reader scroll sync (first screen -> preview)
export function publishReaderScroll(deltaY: number, sourceViewportHeight?: number): void {
  const vh = typeof window !== 'undefined' ? (sourceViewportHeight || window.innerHeight || 0) : (sourceViewportHeight || 0);
  if (bc) {
    bc.postMessage({ type: 'reader-scroll', payload: { dy: deltaY, vh } });
  } else if (typeof window !== 'undefined') {
    try {
      const key = `${CHANNEL}:reader-scroll`;
      const payload = { dy: deltaY, vh, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {}
  }
}

export function subscribeReaderScroll(onScroll: (p: ReaderScrollPayload) => void): () => void {
  const onMessage = (ev: MessageEvent) => {
    const data = ev.data;
    if (data?.type === 'reader-scroll' && data.payload) onScroll(data.payload);
  };

  const onStorage = (ev: StorageEvent) => {
    if (!ev.key || !ev.newValue) return;
    if (ev.key.startsWith(`${CHANNEL}:reader-scroll`)) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (parsed && typeof parsed.dy === 'number') onScroll({ dy: parsed.dy, vh: parsed.vh });
      } catch {}
    }
  };

  if (bc) {
    bc.addEventListener('message', onMessage);
    return () => bc && bc.removeEventListener('message', onMessage as any);
  }
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

// Player sync
export function publishPlayerPlay(payload: PlayerPayload): void {
  if (bc) {
    bc.postMessage({ type: 'player', action: 'play', payload });
  } else if (typeof window !== 'undefined') {
    try {
      const key = `${CHANNEL}:player`;
      const data = { action: 'play', payload, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }
}

export function publishPlayerStop(): void {
  if (bc) {
    bc.postMessage({ type: 'player', action: 'stop' });
  } else if (typeof window !== 'undefined') {
    try {
      const key = `${CHANNEL}:player`;
      const data = { action: 'stop', ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }
}

export function subscribePlayer(onPlay: (p: PlayerPayload) => void, onStop: () => void): () => void {
  const onMessage = (ev: MessageEvent) => {
    const data = ev.data;
    if (data?.type === 'player') {
      if (data.action === 'play' && data.payload) onPlay(data.payload);
      if (data.action === 'stop') onStop();
    }
  };

  const onStorage = (ev: StorageEvent) => {
    if (!ev.key || !ev.newValue) return;
    if (ev.key.startsWith(`${CHANNEL}:player`)) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (parsed?.action === 'play' && parsed.payload) onPlay(parsed.payload);
        if (parsed?.action === 'stop') onStop();
      } catch {}
    }
  };

  if (bc) {
    bc.addEventListener('message', onMessage);
    return () => bc && bc.removeEventListener('message', onMessage as any);
  }
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

// Milestones carousel sync
export type MilestonePayload = { id: number; title: string; overview: string; banner: string };
export function publishMilestonesState(items: MilestonePayload[], index: number): void {
  if (bc) {
    bc.postMessage({ type: 'milestones', items, index });
  } else if (typeof window !== 'undefined') {
    try {
      const key = `${CHANNEL}:milestones`;
      const payload = { items, index, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {}
  }
}

export function subscribeMilestonesState(onState: (items: MilestonePayload[], index: number) => void): () => void {
  const onMessage = (ev: MessageEvent) => {
    const data = ev.data;
    if (data?.type === 'milestones' && Array.isArray(data.items)) onState(data.items, Number(data.index) || 0);
  };

  const onStorage = (ev: StorageEvent) => {
    if (!ev.key || !ev.newValue) return;
    if (ev.key.startsWith(`${CHANNEL}:milestones`)) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (Array.isArray(parsed?.items)) onState(parsed.items, Number(parsed.index) || 0);
      } catch {}
    }
  };

  if (bc) {
    bc.addEventListener('message', onMessage);
    return () => bc && bc.removeEventListener('message', onMessage as any);
  }
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

// Milestones horizontal scroll sync
export function publishMilestonesScroll(dx: number): void {
  if (bc) {
    bc.postMessage({ type: 'milestones-scroll', payload: { dx } });
  } else if (typeof window !== 'undefined') {
    try {
      const key = `${CHANNEL}:milestones-scroll`;
      const payload = { dx, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {}
  }
}

export function subscribeMilestonesScroll(onScroll: (dx: number) => void): () => void {
  const onMessage = (ev: MessageEvent) => {
    const data = ev.data;
    if (data?.type === 'milestones-scroll' && data.payload && typeof data.payload.dx === 'number') onScroll(data.payload.dx);
  };

  const onStorage = (ev: StorageEvent) => {
    if (!ev.key || !ev.newValue) return;
    if (ev.key.startsWith(`${CHANNEL}:milestones-scroll`)) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (parsed && typeof parsed.dx === 'number') onScroll(parsed.dx);
      } catch {}
    }
  };

  if (bc) {
    bc.addEventListener('message', onMessage);
    return () => bc && bc.removeEventListener('message', onMessage as any);
  }
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

// Route sync so preview can switch modes
export function publishRoute(pathname: string): void {
  if (bc) {
    bc.postMessage({ type: 'route', pathname });
  } else if (typeof window !== 'undefined') {
    try {
      const key = `${CHANNEL}:route`;
      const payload = { pathname, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {}
  }
}

export function subscribeRoute(onRoute: (pathname: string) => void): () => void {
  const onMessage = (ev: MessageEvent) => {
    const data = ev.data;
    if (data?.type === 'route' && typeof data.pathname === 'string') onRoute(data.pathname);
  };

  const onStorage = (ev: StorageEvent) => {
    if (!ev.key || !ev.newValue) return;
    if (ev.key.startsWith(`${CHANNEL}:route`)) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (typeof parsed?.pathname === 'string') onRoute(parsed.pathname);
      } catch {}
    }
  };

  if (bc) {
    bc.addEventListener('message', onMessage);
    return () => bc && bc.removeEventListener('message', onMessage as any);
  }
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
} 