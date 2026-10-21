import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  // Most tests exercise the page behind the promo popup; promo.test.tsx covers the popup itself.
  const d = new Date();
  window.localStorage.setItem('tookfit.promo.hiddenOn.v1', JSON.stringify(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`));
});

afterEach(() => {
  cleanup();
});

window.scrollTo = () => {};

// jsdom lacks these browser APIs used by Motion.
class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(window as unknown as { IntersectionObserver: unknown }).IntersectionObserver ??= IO;
(window as unknown as { ResizeObserver: unknown }).ResizeObserver ??= IO;
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia;
