import type { AppData, Task, HistoryEntry, GachaData, ImageSettings } from '../types';

const STORAGE_KEY = 'habit-tracker-data';
const GACHA_STORAGE_KEY = 'habit-tracker-gacha';
const IMAGE_SETTINGS_KEY = 'habit-tracker-image-settings';

const defaultImageSettings: ImageSettings = {
  provider: 'pollinations',
  hfToken: '',
  hfModel: 'stabilityai/stable-diffusion-3-medium-diffusers/black-forest-labs/FLUX.1-schnell',
  cfAccountId: '',
  cfToken: '',
  cfModel: '@cf/bytedance/stable-diffusion-xl-lightning',
};

export function loadImageSettings(): ImageSettings {
  try {
    const raw = localStorage.getItem(IMAGE_SETTINGS_KEY);
    if (!raw) return defaultImageSettings;
    const parsed = JSON.parse(raw) as Partial<ImageSettings>;
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
  } catch {
    return defaultImageSettings;
  }
}

export function saveImageSettings(settings: ImageSettings): void {
  localStorage.setItem(IMAGE_SETTINGS_KEY, JSON.stringify(settings));
}

const defaultGachaData: GachaData = {
  coins: 0,
  ownedCards: [],
  dailyBonuses: [],
  customSeasons: [],
  activeSeasonId: null,
};

export function loadGachaData(): GachaData {
  try {
    const raw = localStorage.getItem(GACHA_STORAGE_KEY);
    if (!raw) return defaultGachaData;
    const parsed = JSON.parse(raw) as Partial<GachaData>;
    return {
      coins: typeof parsed.coins === 'number' ? parsed.coins : 0,
      ownedCards: Array.isArray(parsed.ownedCards) ? parsed.ownedCards : [],
      dailyBonuses: Array.isArray(parsed.dailyBonuses) ? parsed.dailyBonuses : [],
      customSeasons: Array.isArray(parsed.customSeasons) ? parsed.customSeasons : [],
      activeSeasonId: parsed.activeSeasonId ?? null,
    };
  } catch {
    return defaultGachaData;
  }
}

export function saveGachaData(data: GachaData): void {
  localStorage.setItem(GACHA_STORAGE_KEY, JSON.stringify(data));
}

const defaultData: AppData = {
  tasks: [],
  history: [],
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as AppData;
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return defaultData;
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
