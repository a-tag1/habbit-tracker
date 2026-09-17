import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
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
  memo: string;
  number: number | undefined;
  onMemoChange: (taskId: string, memo: string) => void;
  onNumberChange: (taskId: string, number: number | undefined) => void;
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

export default function TaskItem({ task, status, history, dateStr, onComplete, onSkip, memo, number, onMemoChange, onNumberChange }: Props) {
  const progress = getProgressCounter(task, history, dateStr);
  const prevStatus = useRef(status);
  const [justCompleted, setJustCompleted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const hasDetail = task.memoEnabled || task.numberEnabled;
  const memoPreview = memo.trim() ? memo.trim().length > 28 ? `${memo.trim().slice(0, 28).trimEnd()}…` : memo.trim() : '';

  useEffect(() => {
    if (prevStatus.current !== 'completed' && status === 'completed') {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 600);
      return () => clearTimeout(timer);
    }
    prevStatus.current = status;
  }, [status]);

  return (
    <div className={`border-b border-zinc-800/60 ${justCompleted ? 'task-complete' : ''}`}>
      <div className="flex items-center">
        {/* 左エリア: 完了トグル */}
        <button
          onClick={() => onComplete(task)}
          className={`flex-1 flex items-center gap-3 px-4 py-3.5 min-w-0 active:opacity-70 text-left ${LEFT_STYLES[status]}`}
        >
          {task.icon && (() => {
            const Icon = TASK_ICON_MAP[task.icon!];
            return Icon ? <Icon size={20} strokeWidth={1.5} className="shrink-0 opacity-70" /> : null;
          })()}
          {status === 'completed' ? (
            <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <Check size={13} strokeWidth={3} className="text-white" />
            </span>
          ) : (
            <span className="text-sm font-mono w-5 flex items-center justify-center shrink-0 opacity-70">
              {STATUS_ICON[status]}
            </span>
          )}
          <span className="font-medium truncate text-sm">{task.title}</span>
          {progress && (
            <span className={`text-xs font-mono shrink-0 ml-auto flex items-center gap-1 ${
              status === 'completed' ? 'text-emerald-600' : 'text-zinc-500'
            }`}>
              <span>{progress.current}/{progress.target}</span>
              <span className="text-[10px] opacity-80">{progress.target > 0 ? `${Math.round((progress.current / progress.target) * 100)}%` : '0%'}</span>
            </span>
          )}
        </button>

        {/* 詳細展開ボタン */}
        {hasDetail && (
          <button
            onClick={() => setExpanded(v => !v)}
            aria-label="詳細"
            className={`shrink-0 px-2 py-3.5 transition-colors active:opacity-70 ${
              expanded ? 'text-emerald-400' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <ChevronDown size={16} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}

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

      {!expanded && hasDetail && (
        <div className="px-4 pb-2 flex flex-col gap-1 text-[10px] text-zinc-500/80">
          {task.numberEnabled && number !== undefined && (
            <div className="flex items-center gap-2">
              <span className="w-8 text-zinc-400">数値</span>
              <span className="font-mono text-zinc-500">{number}</span>
            </div>
          )}
          {task.memoEnabled && memoPreview && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-8 shrink-0 text-zinc-400">メモ</span>
              <span className="truncate min-w-0 text-zinc-500">{memoPreview}</span>
            </div>
          )}
        </div>
      )}

      {/* 詳細パネル */}
      {hasDetail && expanded && (
        <div className="px-4 pb-3 flex flex-col gap-3 bg-zinc-900/40">
          {task.numberEnabled && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 w-8">数値</span>
              <button
                onClick={() => onNumberChange(task.id, Math.max(0, (number ?? 0) - 1))}
                className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-100 flex items-center justify-center text-lg font-light shrink-0"
              >
                −
              </button>
              <input
                type="number"
                value={number ?? 0}
                min={0}
                onFocus={e => e.target.select()}
                onChange={e => {
                  const normalized = e.target.value.replace(/^0+(?=\d)/, '');
                  onNumberChange(task.id, Math.max(0, parseInt(normalized, 10) || 0));
                }}
                className="w-20 text-center text-lg font-mono font-semibold text-zinc-100 bg-transparent border border-zinc-700 rounded-xl py-1 outline-none focus:border-emerald-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => onNumberChange(task.id, (number ?? 0) + 1)}
                className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-100 flex items-center justify-center text-lg font-light shrink-0"
              >
                ＋
              </button>
            </div>
          )}
          {task.memoEnabled && (
            <textarea
              value={memo}
              onChange={e => onMemoChange(task.id, e.target.value)}
              placeholder="メモを入力…"
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2 outline-none focus:border-emerald-500 transition-colors resize-none placeholder-zinc-600"
            />
          )}
        </div>
      )}
    </div>
  );
}
