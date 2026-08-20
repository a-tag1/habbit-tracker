import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { getProgressCounter } from '../../utils/statistics';
import type { HistoryEntry } from '../../types';
import { TASK_ICON_MAP } from '../../utils/taskIcons';

interface Props {
  task: Task;
  status: TaskStatus;
  history: HistoryEntry[];
  dateStr: string;
  onComplete: (task: Task) => void;
  onSkip: (task: Task) => void;
}

const LEFT_STYLES: Record<TaskStatus, string> = {
  pending: 'text-zinc-500',
  completed: 'text-emerald-400',
  skipped: 'text-zinc-500 line-through',
};

const STATUS_ICON: Record<TaskStatus, string> = {
  pending: '○',
  completed: '✓',
  skipped: '—',
};

export default function TaskItem({ task, status, history, dateStr, onComplete, onSkip }: Props) {
  const progress = getProgressCounter(task, history, dateStr);
  const prevStatus = useRef(status);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (prevStatus.current !== 'completed' && status === 'completed') {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 600);
      return () => clearTimeout(timer);
    }
    prevStatus.current = status;
  }, [status]);

  return (
    <div className={`flex items-center border-b border-zinc-800/60 ${justCompleted ? 'task-complete' : ''}`}>
      {/* 左エリア: 完了トグル */}
      <button
        onClick={() => onComplete(task)}
        className={`flex-1 flex items-center gap-3 px-4 py-3.5 min-w-0 active:opacity-70 text-left ${LEFT_STYLES[status]}`}
      >
        {task.icon && (() => {
          const Icon = TASK_ICON_MAP[task.icon!];
          return Icon ? <Icon size={20} strokeWidth={1.5} className="shrink-0 opacity-70" /> : null;
        })()}
        <span className="text-sm font-mono w-5 flex items-center justify-center shrink-0 opacity-70">
          {status === 'completed'
            ? <Check size={20} strokeWidth={3} />
            : STATUS_ICON[status]}
        </span>
        <span className="font-medium truncate text-sm">{task.title}</span>
        {progress && (
          <span className={`text-xs font-mono shrink-0 ml-auto ${
            status === 'completed' ? 'text-emerald-600' : 'text-zinc-500'
          }`}>
            {progress.current}/{progress.target}
          </span>
        )}
      </button>

      {/* 右エリア: スキップトグル */}
      <button
        onClick={() => onSkip(task)}
        aria-label="やらない"
        className={`shrink-0 pr-4 pl-2 py-3.5 transition-colors active:opacity-70 ${
          status === 'skipped'
            ? 'text-amber-500'
            : status === 'completed'
            ? 'text-emerald-700'
            : 'text-zinc-600 hover:text-zinc-400'
        }`}
      >
        <span className="text-sm">✕</span>
      </button>
    </div>
  );
}
