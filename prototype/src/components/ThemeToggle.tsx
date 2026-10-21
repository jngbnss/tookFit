import { useEffect, useState } from 'react';
import { readJSON, STORAGE_KEYS, writeJSON } from '../lib/storage';
import { MoonIcon, SunIcon } from './Icons';

type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  const saved = readJSON<Theme | null>(STORAGE_KEYS.theme, null);
  if (saved) return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={next === 'dark' ? '다크 모드로 전환' : '라이트 모드로 전환'}
      title={next === 'dark' ? '다크 모드' : '라이트 모드'}
      onClick={() => {
        setTheme(next);
        writeJSON(STORAGE_KEYS.theme, next);
      }}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
