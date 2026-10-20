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
