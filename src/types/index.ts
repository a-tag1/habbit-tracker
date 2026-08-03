export type FrequencyType = 'daily' | 'weekly' | 'monthly';

export type TaskStatus = 'pending' | 'completed' | 'skipped';

export interface Task {
  id: string;
  title: string;
  icon?: string;
  frequencyType: FrequencyType;
  frequencyCount: number;
  weekDays?: number[];  // weekly 時の対象曜日: 0=日, 1=月, ..., 6=土
  order: number;
  createdAt: string;
}

export interface HistoryEntry {
  date: string; // 'YYYY-MM-DD'
  taskId: string;
  status: TaskStatus;
}

export interface AppData {
  tasks: Task[];
  history: HistoryEntry[];
}

export type AppView = 'daily' | 'statistics' | 'settings' | 'tasks';

export type ThemeKey = 'black' | 'white' | 'blue';
