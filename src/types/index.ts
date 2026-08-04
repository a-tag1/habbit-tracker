export type FrequencyType = 'daily' | 'weekly' | 'monthly';

export type TaskStatus = 'pending' | 'completed' | 'skipped';

export interface Task {
  id: string;
  title: string;
  icon?: string;
  frequencyType: FrequencyType;
  frequencyCount: number;
  weekDays?: number[];  // weekly 時の対象曜日: 0=日, 1=月, ..., 6=土
  difficulty?: 'normal' | 'hard';
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

export type AppView = 'daily' | 'statistics' | 'settings' | 'tasks' | 'gacha';

export type ThemeKey = 'black' | 'white' | 'blue';

// ─── Gacha / Coin ────────────────────────────────────────

export type Rarity = 'N' | 'R' | 'SR' | 'SSR';

export interface CardMaster {
  id: string;
  name: string;
  rarity: Rarity;
  prompt: string;
  cheerMessage: string;
}

export interface OwnedCard {
  userCardId: string;
  cardMasterId: string;
  name: string;
  rarity: Rarity;
  seed: number;
  imageUrl: string;
  cheerMessage: string;
  obtainedAt: string;
  seasonId?: string; // undefined = base season
}

export interface DailyBonus {
  date: string;
  bonus5: boolean;
  bonus10: boolean;
  complete: boolean;
}

export interface CustomSeason {
  id: string;
  theme: string;
  cards: CardMaster[];
  createdAt: string;
}

export interface GachaData {
  coins: number;
  ownedCards: OwnedCard[];
  dailyBonuses: DailyBonus[];
  customSeasons: CustomSeason[];
  activeSeasonId: string | null;
}
