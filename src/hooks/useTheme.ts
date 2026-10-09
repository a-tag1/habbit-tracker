import { useState, useEffect } from 'react';
import { applyThemeSettings, loadInitialThemeSettings, THEME_SETTINGS_STORAGE_KEY } from '../utils/theme';

export function useTheme() {
  const [themeSettings, setThemeSettings] = useState(loadInitialThemeSettings);

  useEffect(() => {
    applyThemeSettings(themeSettings);
    localStorage.setItem(THEME_SETTINGS_STORAGE_KEY, JSON.stringify(themeSettings));
  }, [themeSettings]);

  return { themeSettings, setThemeSettings };
}
