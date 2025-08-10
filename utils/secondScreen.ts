import { subscribeRoute } from './heroSync';

let secondWin: Window | null = null;
let secondPresent = false;

// Initialize presence detection (any tab hearing /preview route means a second screen exists)
if (typeof window !== 'undefined') {
  try {
    subscribeRoute((pathname) => {
      if (pathname === '/preview') {
        secondPresent = true;
      }
    });
  } catch {}
}

export function ensureSecondWindow(path = '/preview'): Window | null {
  try {
    if (secondWin && !secondWin.closed) {
      secondWin.focus();
      return secondWin;
    }
    // If another window already running second screen, don't open a new one
    if (secondPresent) return null;

    const url = `${window.location.origin}${path}`;
    secondWin = window.open(url, 'nextflix_second_screen', 'noopener');
    return secondWin;
  } catch {
    return null;
  }
}

export function isSecondWindowOpen(): boolean {
  return !!secondWin && !secondWin.closed;
}

export function isSecondScreenPresent(): boolean {
  return secondPresent || isSecondWindowOpen();
} 