import type { AppData, Task, HistoryEntry, GachaData, ImageSettings } from '../types';

// ─── IndexedDB wrapper ──────────────────────────────────
const DB_NAME = 'habit-tracker-db';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { dbPromise = null; reject(req.error); };
  });
  return dbPromise;
}

async function dbGet<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function dbSet<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Keys ───────────────────────────────────────────────
const STORAGE_KEY = 'habit-tracker-data';
const GACHA_STORAGE_KEY = 'habit-tracker-gacha';
const IMAGE_SETTINGS_KEY = 'habit-tracker-image-settings';

// ─── Image Settings ─────────────────────────────────────
export const defaultImageSettings: ImageSettings = {
  provider: 'pollinations',
  hfToken: '',
  hfModel: 'stabilityai/stable-diffusion-3-medium-diffusers/black-forest-labs/FLUX.1-schnell',
  cfAccountId: '',
  cfToken: '',
  cfModel: '@cf/bytedance/stable-diffusion-xl-lightning',
};

function parseImageSettings(parsed: Partial<ImageSettings>): ImageSettings {
  // FLUX.1-schnell は hf-inference で廃止済みのため SD3 へ移行
  const rawModel = typeof parsed.hfModel === 'string' ? parsed.hfModel : 'stabilityai/stable-diffusion-3-medium-diffusers';
  const hfModel = rawModel.startsWith('black-forest-labs/FLUX')
    ? 'stabilityai/stable-diffusion-3-medium-diffusers'
    : rawModel;
  const validProviders = ['pollinations', 'huggingface', 'cloudflare'] as const;
  const provider = validProviders.includes(parsed.provider as typeof validProviders[number])
    ? (parsed.provider as typeof validProviders[number])
    : 'pollinations';
  return {
    provider,
    hfToken: typeof parsed.hfToken === 'string' ? parsed.hfToken : '',
    hfModel,
    cfAccountId: typeof parsed.cfAccountId === 'string' ? parsed.cfAccountId : '',
    cfToken: typeof parsed.cfToken === 'string' ? parsed.cfToken : '',
    cfModel: typeof parsed.cfModel === 'string' ? parsed.cfModel : defaultImageSettings.cfModel,
    cfWorkerUrl: typeof parsed.cfWorkerUrl === 'string' ? parsed.cfWorkerUrl : '',
  };
}

export async function loadImageSettings(): Promise<ImageSettings> {
  try {
    const stored = await dbGet<Partial<ImageSettings>>(IMAGE_SETTINGS_KEY);
    if (stored !== undefined) return parseImageSettings(stored);
    // localStorage からのマイグレーション
    const lsRaw = localStorage.getItem(IMAGE_SETTINGS_KEY);
    if (lsRaw) {
      const settings = parseImageSettings(JSON.parse(lsRaw) as Partial<ImageSettings>);
      await dbSet(IMAGE_SETTINGS_KEY, settings);
      localStorage.removeItem(IMAGE_SETTINGS_KEY);
      return settings;
    }
    return defaultImageSettings;
  } catch {
    return defaultImageSettings;
  }
}

export async function saveImageSettings(settings: ImageSettings): Promise<void> {
  await dbSet(IMAGE_SETTINGS_KEY, settings);
}

// ─── GachaData ───────────────────────────────────────────
export const defaultGachaData: GachaData = {
  coins: 0,
  ownedCards: [],
  dailyBonuses: [],
  customSeasons: [],
  activeSeasonId: null,
};

function parseGachaData(parsed: Partial<GachaData>): GachaData {
  return {
    coins: typeof parsed.coins === 'number' ? parsed.coins : 0,
    ownedCards: Array.isArray(parsed.ownedCards) ? parsed.ownedCards : [],
    dailyBonuses: Array.isArray(parsed.dailyBonuses) ? parsed.dailyBonuses : [],
    customSeasons: Array.isArray(parsed.customSeasons) ? parsed.customSeasons : [],
    activeSeasonId: parsed.activeSeasonId ?? null,
  };
}

export async function loadGachaData(): Promise<GachaData> {
  try {
    const stored = await dbGet<Partial<GachaData>>(GACHA_STORAGE_KEY);
    if (stored !== undefined) return parseGachaData(stored);
    // localStorage からのマイグレーション
    const lsRaw = localStorage.getItem(GACHA_STORAGE_KEY);
    if (lsRaw) {
      const data = parseGachaData(JSON.parse(lsRaw) as Partial<GachaData>);
      await dbSet(GACHA_STORAGE_KEY, data);
      localStorage.removeItem(GACHA_STORAGE_KEY);
      return data;
    }
    return defaultGachaData;
  } catch {
    return defaultGachaData;
  }
}

export async function saveGachaData(data: GachaData): Promise<void> {
  await dbSet(GACHA_STORAGE_KEY, data);
}

// ─── AppData ─────────────────────────────────────────────
export const defaultAppData: AppData = {
  tasks: [],
  history: [],
};

function parseAppData(parsed: Partial<AppData>): AppData {
  return {
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    history: Array.isArray(parsed.history) ? parsed.history : [],
  };
}

export async function loadData(): Promise<AppData> {
  try {
    const stored = await dbGet<Partial<AppData>>(STORAGE_KEY);
    if (stored !== undefined) return parseAppData(stored);
    // localStorage からのマイグレーション
    const lsRaw = localStorage.getItem(STORAGE_KEY);
    if (lsRaw) {
      const data = parseAppData(JSON.parse(lsRaw) as Partial<AppData>);
      await dbSet(STORAGE_KEY, data);
      localStorage.removeItem(STORAGE_KEY);
      return data;
    }
    return defaultAppData;
  } catch {
    return defaultAppData;
  }
}

export async function saveData(data: AppData): Promise<void> {
  await dbSet(STORAGE_KEY, data);
}

export function exportData(data: AppData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habit-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as AppData;
        if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.history)) {
          reject(new Error('無効なデータ形式です'));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error('JSONの解析に失敗しました'));
      }
    };
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsText(file);
  });
}

export function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createTask(title: string, frequencyType: Task['frequencyType'], frequencyCount: number, order: number, icon?: string, weekDays?: number[], difficulty?: Task['difficulty']): Task {
  return {
    id: generateId(),
    title,
    icon,
    frequencyType,
    frequencyCount,
    weekDays,
    difficulty,
    order,
    createdAt: new Date().toISOString(),
  };
}

export function upsertHistory(history: HistoryEntry[], date: string, taskId: string, status: HistoryEntry['status']): HistoryEntry[] {
  const filtered = history.filter(h => !(h.date === date && h.taskId === taskId));
  filtered.push({ date, taskId, status });
  return filtered;
}
