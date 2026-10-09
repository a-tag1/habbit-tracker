import type { CustomTheme, CustomThemeKey, ThemeColors, ThemeKey, ThemeSettings } from '../types';

export const CUSTOM_THEME_KEYS: CustomThemeKey[] = ['custom-1', 'custom-2', 'custom-3'];
export const THEME_SETTINGS_STORAGE_KEY = 'habit-tracker-theme-settings';

export const DEFAULT_CUSTOM_THEMES: Record<CustomThemeKey, CustomTheme> = {
  'custom-1': {
    name: 'カスタム1',
    colors: {
      appBg: '#0f172a', navBg: '#111827', panelBg: '#1e293b', panelBgSoft: '#334155', navText: '#f8fafc',
      textPrimary: '#f8fafc', textSecondary: '#cbd5e1', textMuted: '#94a3b8', border: '#475569',
      primary: '#0ea5e9', primaryText: '#082f49', cancel: '#475569', cancelText: '#f8fafc',
      complete: '#22c55e', completeText: '#14532d', skip: '#f59e0b', skipText: '#78350f',
      warning: '#f59e0b', danger: '#ef4444', info: '#38bdf8', reward: '#facc15',
      rarityCommon: '#94a3b8', rarityRare: '#60a5fa', raritySuperRare: '#c084fc', rarityUltraRare: '#facc15',
    },
  },
  'custom-2': {
    name: 'カスタム2',
    colors: {
      appBg: '#fff7f5', navBg: '#7f1d1d', panelBg: '#ffffff', panelBgSoft: '#ffe4e6', navText: '#fff1f2',
      textPrimary: '#3f1d2e', textSecondary: '#6b3a4c', textMuted: '#9f7483', border: '#fecdd3',
      primary: '#be123c', primaryText: '#ffffff', cancel: '#9f1239', cancelText: '#fff1f2',
      complete: '#16a34a', completeText: '#166534', skip: '#d97706', skipText: '#92400e',
      warning: '#d97706', danger: '#dc2626', info: '#0284c7', reward: '#ca8a04',
      rarityCommon: '#78716c', rarityRare: '#0284c7', raritySuperRare: '#9333ea', rarityUltraRare: '#ca8a04',
    },
  },
  'custom-3': {
    name: 'カスタム3',
    colors: {
      appBg: '#f3f7f4', navBg: '#14532d', panelBg: '#ffffff', panelBgSoft: '#e8f1eb', navText: '#f0fdf4',
      textPrimary: '#14231a', textSecondary: '#334b3a', textMuted: '#64776a', border: '#cbd9cf',
      primary: '#166534', primaryText: '#ffffff', cancel: '#475569', cancelText: '#f8fafc',
      complete: '#15803d', completeText: '#166534', skip: '#ca8a04', skipText: '#854d0e',
      warning: '#d97706', danger: '#dc2626', info: '#0369a1', reward: '#ca8a04',
      rarityCommon: '#64748b', rarityRare: '#2563eb', raritySuperRare: '#7e22ce', rarityUltraRare: '#ca8a04',
    },
  },
};

export const FIXED_THEME_COLORS: Record<'black' | 'white-blue', ThemeColors> = {
  black: {
    appBg: '#27272a', navBg: '#09090b', panelBg: '#18181b', panelBgSoft: '#27272a', navText: '#f4f4f5',
    textPrimary: '#f4f4f5', textSecondary: '#d4d4d8', textMuted: '#a1a1aa', border: '#3f3f46',
    primary: '#2563eb', primaryText: '#ffffff', cancel: '#3f3f46', cancelText: '#f4f4f5',
    complete: '#3b82f6', completeText: '#93c5fd', skip: '#f59e0b', skipText: '#fbbf24',
    warning: '#f59e0b', danger: '#ef4444', info: '#38bdf8', reward: '#facc15',
    rarityCommon: '#a1a1aa', rarityRare: '#60a5fa', raritySuperRare: '#c084fc', rarityUltraRare: '#facc15',
  },
  'white-blue': {
    appBg: '#ffffff', navBg: '#1e3a8a', panelBg: '#f8fbff', panelBgSoft: '#eff6ff', navText: '#ffffff',
    textPrimary: '#111827', textSecondary: '#1e3a8a', textMuted: '#334155', border: '#bfdbfe',
    primary: '#2563eb', primaryText: '#ffffff', cancel: '#1e3a8a', cancelText: '#ffffff',
    complete: '#3b82f6', completeText: '#2563eb', skip: '#d97706', skipText: '#b45309',
    warning: '#d97706', danger: '#dc2626', info: '#0284c7', reward: '#ca8a04',
    rarityCommon: '#64748b', rarityRare: '#2563eb', raritySuperRare: '#7e22ce', rarityUltraRare: '#ca8a04',
  },
};

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  activeTheme: 'black',
  customThemes: DEFAULT_CUSTOM_THEMES,
};

export const THEME_COLOR_GROUPS: { label: string; fields: { key: keyof ThemeColors; label: string }[] }[] = [
  { label: '背景・文字', fields: [
    { key: 'appBg', label: '全体背景' }, { key: 'navBg', label: 'メニュー背景' },
    { key: 'panelBg', label: 'パネル背景' }, { key: 'panelBgSoft', label: 'サブパネル背景' },
    { key: 'navText', label: 'メニュー文字' }, { key: 'textPrimary', label: '基本文字' },
    { key: 'textSecondary', label: '補助文字' }, { key: 'textMuted', label: '控えめな文字' },
    { key: 'border', label: '境界線' },
  ] },
  { label: 'ボタン・状態', fields: [
    { key: 'primary', label: '主要ボタン' }, { key: 'primaryText', label: '主要ボタン文字' },
    { key: 'cancel', label: 'キャンセル' }, { key: 'cancelText', label: 'キャンセル文字' },
    { key: 'complete', label: '完了' }, { key: 'completeText', label: '完了文字' },
    { key: 'skip', label: 'スキップ' }, { key: 'skipText', label: 'スキップ文字' },
    { key: 'warning', label: '注意' }, { key: 'danger', label: 'エラー・削除' }, { key: 'info', label: '情報' },
  ] },
  { label: 'コイン・レアリティ', fields: [
    { key: 'reward', label: 'コイン・報酬' }, { key: 'rarityCommon', label: 'N' },
    { key: 'rarityRare', label: 'R' }, { key: 'raritySuperRare', label: 'SR' },
    { key: 'rarityUltraRare', label: 'SSR' },
  ] },
];

const COLOR_KEYS = Object.keys(DEFAULT_CUSTOM_THEMES['custom-1'].colors) as (keyof ThemeColors)[];
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const VALID_THEME_KEYS: ThemeKey[] = ['black', 'white-blue', ...CUSTOM_THEME_KEYS];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeThemeSettings(value: unknown): ThemeSettings | null {
  if (!isRecord(value) || !VALID_THEME_KEYS.includes(value.activeTheme as ThemeKey) || !isRecord(value.customThemes)) return null;
  const customThemes = {} as ThemeSettings['customThemes'];

  for (const key of CUSTOM_THEME_KEYS) {
    const theme = value.customThemes[key];
    if (!isRecord(theme) || typeof theme.name !== 'string' || !isRecord(theme.colors)) return null;
    const colors = {} as ThemeColors;
    for (const colorKey of COLOR_KEYS) {
      const color = theme.colors[colorKey];
      if (typeof color !== 'string' || !HEX_COLOR.test(color)) return null;
      colors[colorKey] = color;
    }
    customThemes[key] = { name: theme.name.slice(0, 24), colors };
  }

  return { activeTheme: value.activeTheme as ThemeKey, customThemes };
}

export function loadInitialThemeSettings(): ThemeSettings {
  try {
    const stored = localStorage.getItem(THEME_SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = normalizeThemeSettings(JSON.parse(stored));
      if (parsed) return parsed;
    }

    const legacyTheme = localStorage.getItem('habit-tracker-theme');
    const migrated = { ...DEFAULT_THEME_SETTINGS, customThemes: { ...DEFAULT_CUSTOM_THEMES } };
    if (legacyTheme === 'black') migrated.activeTheme = 'black';
    else if (legacyTheme === 'blue') migrated.activeTheme = 'custom-1';
    else if (legacyTheme === 'sonota-theme') migrated.activeTheme = 'custom-2';
    else if (legacyTheme) migrated.activeTheme = 'white-blue';
    return migrated;
  } catch {
    return DEFAULT_THEME_SETTINGS;
  }
}

const ZINC_SCALE: Record<string, keyof ThemeColors> = {
  50: 'textPrimary', 100: 'textPrimary', 200: 'textSecondary', 300: 'textSecondary',
  400: 'textMuted', 500: 'textMuted', 600: 'textMuted', 700: 'border',
  800: 'panelBgSoft', 900: 'panelBg', 950: 'appBg',
};

export function applyThemeSettings(settings: ThemeSettings): void {
  const root = document.documentElement;
  root.dataset.theme = settings.activeTheme;
  for (const property of Object.keys(themeVariables(settings.customThemes['custom-1'].colors))) {
    root.style.removeProperty(property);
  }

  const colors = settings.activeTheme === 'black' || settings.activeTheme === 'white-blue'
    ? FIXED_THEME_COLORS[settings.activeTheme]
    : settings.customThemes[settings.activeTheme].colors;
  for (const [property, value] of Object.entries(themeVariables(colors))) {
    root.style.setProperty(property, value);
  }
}

function themeVariables(colors: ThemeColors): Record<string, string> {
  const vars: Record<string, string> = {
    '--app-bg': colors.appBg,
    '--app-color': colors.textPrimary,
    '--nav-bg': colors.navBg,
    '--nav-text': colors.navText,
    '--text-primary': colors.textPrimary,
    '--text-secondary': colors.textSecondary,
    '--text-muted': colors.textMuted,
    '--panel-bg': colors.panelBg,
    '--panel-bg-soft': colors.panelBgSoft,
    '--panel-border': colors.border,
    '--task-complete-bg': `color-mix(in srgb, ${colors.complete} 28%, transparent)`,
    '--theme-primary': colors.primary,
    '--theme-primary-text': colors.primaryText,
    '--theme-cancel': colors.cancel,
    '--theme-cancel-text': colors.cancelText,
    '--theme-complete': colors.complete,
    '--theme-complete-text': colors.completeText,
    '--theme-skip': colors.skip,
    '--theme-skip-text': colors.skipText,
    '--theme-warning': colors.warning,
    '--theme-danger': colors.danger,
    '--theme-info': colors.info,
    '--theme-reward': colors.reward,
    '--theme-rarity-common': colors.rarityCommon,
    '--theme-rarity-rare': colors.rarityRare,
    '--theme-rarity-super-rare': colors.raritySuperRare,
    '--theme-rarity-ultra-rare': colors.rarityUltraRare,
    '--color-white': colors.primaryText,
    '--color-black': colors.textPrimary,
  };

  for (const [shade, key] of Object.entries(ZINC_SCALE)) vars[`--color-zinc-${shade}`] = colors[key];
  for (const shade of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
    vars[`--color-gray-${shade}`] = shade < 400 ? colors.textPrimary : shade < 600 ? colors.textMuted : colors.border;
  }
  for (const shade of [50, 100, 200, 300]) vars[`--color-emerald-${shade}`] = colors.primaryText;
  for (const shade of [400, 500]) vars[`--color-emerald-${shade}`] = shade === 500 ? colors.complete : colors.completeText;
  for (const shade of [600, 700, 800, 900, 950]) vars[`--color-emerald-${shade}`] = colors.primary;
  for (const shade of [400, 500, 600]) vars[`--color-amber-${shade}`] = colors.warning;
  for (const shade of [300, 400, 500, 600, 700, 800, 900, 950]) {
    const dangerShade = shade < 700 ? colors.danger : `color-mix(in srgb, ${colors.danger} 28%, ${colors.panelBg})`;
    vars[`--color-red-${shade}`] = dangerShade;
    vars[`--color-rose-${shade}`] = dangerShade;
  }
  for (const shade of [300, 400, 500, 600, 700, 800, 900, 950]) {
    vars[`--color-yellow-${shade}`] = shade < 700 ? colors.rarityUltraRare : `color-mix(in srgb, ${colors.rarityUltraRare} 28%, ${colors.panelBg})`;
    vars[`--color-blue-${shade}`] = shade < 700 ? colors.rarityRare : `color-mix(in srgb, ${colors.rarityRare} 28%, ${colors.panelBg})`;
    vars[`--color-purple-${shade}`] = shade < 700 ? colors.raritySuperRare : `color-mix(in srgb, ${colors.raritySuperRare} 28%, ${colors.panelBg})`;
    vars[`--color-cyan-${shade}`] = shade < 700 ? colors.info : `color-mix(in srgb, ${colors.info} 28%, ${colors.panelBg})`;
  }
  return vars;
}