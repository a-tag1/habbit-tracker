import {
  BookOpen,
  Brain,
  Dumbbell,
  Heart,
  Mic,
  Star,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';

export const TASK_ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  BookOpen,
  Brain,
  Dumbbell,
  Heart,
  Mic,
  Star,
};

export const TASK_ICON_OPTIONS: { key: string; label: string }[] = [
  { key: 'BookOpen', label: '読書' },
  { key: 'Brain',    label: '脳トレ' },
  { key: 'Dumbbell', label: '筋トレ' },
  { key: 'Heart',    label: '健康' },
  { key: 'Mic',      label: 'スピーチ' },
  { key: 'Star',     label: 'その他' },
];
