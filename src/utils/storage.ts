import type { AppData, Task, HistoryEntry } from '../types';

const STORAGE_KEY = 'habit-tracker-data';

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

export function createTask(title: string, frequencyType: Task['frequencyType'], frequencyCount: number, order: number, icon?: string, weekDays?: number[]): Task {
  return {
    id: generateId(),
    title,
    icon,
    frequencyType,
    frequencyCount,
    weekDays,
    order,
    createdAt: new Date().toISOString(),
  };
}

export function upsertHistory(history: HistoryEntry[], date: string, taskId: string, status: HistoryEntry['status']): HistoryEntry[] {
  const filtered = history.filter(h => !(h.date === date && h.taskId === taskId));
  filtered.push({ date, taskId, status });
  return filtered;
}
