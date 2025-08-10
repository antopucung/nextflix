type HeroSlidePayload = { id: number; img: string; title: string; synopsis: string };

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