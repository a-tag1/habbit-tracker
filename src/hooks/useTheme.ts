import { useState, useEffect } from 'react';
import type { ThemeKey } from '../types';

const STORAGE_KEY = 'habit-tracker-theme';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeKey>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeKey | null;
    const initial = saved ?? 'black';
    document.documentElement.setAttribute('data-theme', initial);
    return initial;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return { theme, setTheme };
}
