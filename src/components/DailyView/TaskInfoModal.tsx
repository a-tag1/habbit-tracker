import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { HistoryEntry, Task } from '../../types';
import { addDays, formatDisplayDate, getDayOfWeek, isFuture, isToday } from '../../utils/dateUtils';
import { getTaskProgressRates } from '../../utils/statistics';

interface Props {
  task: Task;
  history: HistoryEntry[];
  dateStr: string;
  onClose: () => void;
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function formatCount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function getFrequencyLabel(task: Task): string {
  if (task.frequencyType === 'daily') return '毎日';
  if (task.frequencyType === 'monthly') return `月 ${task.frequencyCount} 回`;
  if (task.weekDays && task.weekDays.length > 0) {
    return task.weekDays.map(day => DAY_LABELS[day]).join('・');
  }
  return `週 ${task.frequencyCount} 回`;
}

function getHistoryStatus(status: HistoryEntry['status']): { label: string; className: string } {
  if (status === 'completed') return { label: '✓ 完了', className: 'text-emerald-400' };
  if (status === 'skipped') return { label: '— スキップ', className: 'text-zinc-400' };
  return { label: '○ 未完了', className: 'text-zinc-400' };
}

export default function TaskInfoModal({ task, history, dateStr, onClose }: Props) {
  const rates = getTaskProgressRates(task, history, dateStr);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const recentDates = Array.from({ length: 7 }, (_, index) => addDays(dateStr, -index));

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.showModal();

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby="task-info-title"
      className="fixed inset-0 m-0 h-[100dvh] max-h-none w-full max-w-none border-0 bg-transparent p-4 backdrop:bg-transparent open:flex items-center justify-center touch-none"
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <section
        className="relative w-full max-w-[480px] max-h-[85dvh] overflow-y-auto overscroll-contain touch-auto bg-zinc-900 rounded-lg px-5 pt-5 pb-8"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="min-w-0">
            <h2 id="task-info-title" className="text-base font-semibold text-zinc-100 truncate">{task.title}</h2>
            <p className="text-xs text-zinc-500 mt-1">{formatDisplayDate(dateStr)} 時点</p>
          </div>
          <button onClick={onClose} aria-label="閉じる" className="shrink-0 p-1 text-zinc-400 hover:text-zinc-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-lg bg-zinc-800 px-3 py-3">
            <p className="text-xs text-zinc-400 mb-1">達成率</p>
            <p className="text-2xl font-semibold font-mono text-emerald-400">{rates.achievementRate}%</p>
            <p className="text-[11px] text-zinc-500 mt-1">{rates.completedCount} / {formatCount(rates.monthlyTarget)} 回</p>
          </div>
          <div className="rounded-lg bg-zinc-800 px-3 py-3">
            <p className="text-xs text-zinc-400 mb-1">予定ペース進捗</p>
            <p className="text-2xl font-semibold font-mono text-sky-400">{rates.paceRate}%</p>
            <p className="text-[11px] text-zinc-500 mt-1">{rates.completedCount} / {formatCount(rates.expectedByDate)} 回</p>
          </div>
        </div>

        <div className="divide-y divide-zinc-800 border-y border-zinc-800">
          <div className="flex items-center justify-between gap-4 py-3 text-sm">
            <span className="text-zinc-400">繰り返し</span>
            <span className="text-right text-zinc-100">{getFrequencyLabel(task)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-3 text-sm">
            <span className="text-zinc-400">難易度</span>
            <span className="text-right text-zinc-100">{task.difficulty === 'hard' ? 'ハード' : 'ノーマル'}</span>
          </div>
        </div>

        <div className="pt-5">
          <h3 className="text-sm font-medium text-zinc-200 mb-2">直近7日間</h3>
          <div className="divide-y divide-zinc-800 rounded-lg bg-zinc-800/50 px-3">
            {recentDates.map(date => {
              const entry = history.find(item => item.date === date && item.taskId === task.id);
              const isScheduled = task.frequencyType !== 'weekly'
                || !task.weekDays?.length
                || task.weekDays.includes(getDayOfWeek(date));
              const status = entry
                ? getHistoryStatus(entry.status)
                : !isScheduled
                  ? { label: '対象外', className: 'text-zinc-600' }
                  : isFuture(date)
                    ? { label: '未到来', className: 'text-sky-400' }
                    : { label: '未記録', className: 'text-zinc-500' };

              return (
                <div key={date} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="text-zinc-300">
                    {formatDisplayDate(date)}
                    {isToday(date) && <span className="ml-1.5 text-[11px] text-emerald-500">今日</span>}
                  </span>
                  <span className={`shrink-0 text-xs ${status.className}`}>{status.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4">
          <h3 className="text-xs font-medium text-zinc-400 mb-2">タスク共通メモ</h3>
          {task.commonMemo?.trim() ? (
            <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap break-words">{task.commonMemo}</p>
          ) : (
            <p className="text-sm text-zinc-600">メモはありません</p>
          )}
        </div>
      </section>
    </dialog>,
    document.body,
  );
}