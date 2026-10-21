import { createContext, useContext, useState, type CSSProperties, type ReactNode } from 'react';
import { getMood, type Mood, type MoodId } from '../data/moods';
import { readJSON, writeJSON } from '../lib/storage';

const KEY = 'tookfit.mood.v1';

interface MoodValue {
  mood: Mood;
  setMood: (id: MoodId) => void;
}

const MoodCtx = createContext<MoodValue | null>(null);

export function MoodProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<MoodId>(() => readJSON<MoodId>(KEY, 'minimal'));
  const value: MoodValue = {
    mood: getMood(id),
    setMood: (next) => {
      setId(next);
      writeJSON(KEY, next);
    },
  };
  return <MoodCtx.Provider value={value}>{children}</MoodCtx.Provider>;
}

export function useMood() {
  const ctx = useContext(MoodCtx);
  if (!ctx) throw new Error('useMood must be used inside MoodProvider');
  return ctx;
}

/** CSS variables that re-skin a section for the active mood. */
export function moodStyle(mood: Mood): CSSProperties {
  return {
    '--mood-bg': mood.bg,
    '--mood-ink': mood.ink,
    '--mood-accent': mood.accent,
    '--mood-soft': mood.soft,
    '--mood-font': mood.font,
  } as CSSProperties;
}
