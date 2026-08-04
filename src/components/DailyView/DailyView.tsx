import { useCallback } from 'react';
import type { Task, TaskStatus, HistoryEntry } from '../../types';
import { formatDisplayDate, addDays, isFuture, isToday, getDayOfWeek } from '../../utils/dateUtils';
import { useSwipe } from '../../hooks/useSwipe';
import TaskItem from './TaskItem';

interface Props {
  tasks: Task[];
  history: HistoryEntry[];
  currentDate: string;
  onDateChange: (date: string) => void;
  onSetStatus: (date: string, taskId: string, status: TaskStatus) => void;
  getStatus: (date: string, taskId: string) => TaskStatus;
  coins: number;
  lastCoinGain: number;
  gainKey: number;
  onNavigateGacha: () => void;
}

export default function DailyView({ tasks, history, currentDate, onDateChange, onSetStatus, getStatus, coins, lastCoinGain, gainKey, onNavigateGacha }: Props) {
  const goNext = useCallback(() => {
    const next = addDays(currentDate, 1);
    if (!isFuture(next) || next === new Date().toISOString().slice(0, 10)) {
      onDateChange(next);
    } else if (isToday(currentDate)) {
      // already today, allow going to tomorrow to log in advance? No per spec - don't allow future
    } else {
      onDateChange(next);
    }
  }, [currentDate, onDateChange]);

  const goPrev = useCallback(() => {
    onDateChange(addDays(currentDate, -1));
  }, [currentDate, onDateChange]);

  const { onTouchStart, onTouchEnd } = useSwipe(goNext, goPrev);

  const handleComplete = useCallback((task: Task) => {
    const current = getStatus(currentDate, task.id);
    const next: TaskStatus = current === 'completed' ? 'pending' : 'completed';
    onSetStatus(currentDate, task.id, next);
  }, [currentDate, getStatus, onSetStatus]);

  const handleSkip = useCallback((task: Task) => {
    const current = getStatus(currentDate, task.id);
    const next: TaskStatus = current === 'skipped' ? 'pending' : 'skipped';
    onSetStatus(currentDate, task.id, next);
  }, [currentDate, getStatus, onSetStatus]);

  const dayOfWeek = getDayOfWeek(currentDate);
  const visibleTasks = tasks.filter(task => {
    if (task.frequencyType !== 'weekly') return true;
    if (!task.weekDays || task.weekDays.length === 0) return true;
    return task.weekDays.includes(dayOfWeek);
  });

  const completedCount = visibleTasks.filter(t => getStatus(currentDate, t.id) === 'completed').length;
  const totalCount = visibleTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const isCurrentFuture = isFuture(currentDate);

  return (
    <div
      className="flex flex-col flex-1 overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800">
        <div className="relative flex items-center justify-between mb-2">
          <button
            onClick={goPrev}
            className="p-2 rounded-full hover:bg-zinc-800 active:bg-zinc-700 transition-colors text-zinc-400"
            aria-label="前の日"
          >
            ‹
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <div className="font-semibold text-base text-zinc-100">{formatDisplayDate(currentDate)}</div>
            {isToday(currentDate) && (
              <div className="text-xs text-emerald-500 mt-0.5">今日</div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* コイン表示ボタン */}
            <div className="relative">
              <button
                onClick={onNavigateGacha}
                className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-full px-2.5 py-1 transition-colors"
                aria-label="ガチャへ"
              >
                <span className="text-sm leading-none">🪙</span>
                <span className="text-xs font-mono font-bold text-yellow-400">{coins}</span>
              </button>
              {/* コイン獲得アニメーション */}
              {lastCoinGain > 0 && (
                <span
                  key={gainKey}
                  className="coin-float absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold text-yellow-400 whitespace-nowrap pointer-events-none"
                >
                  +{lastCoinGain}🪙
                </span>
              )}
            </div>
            <button
              onClick={goNext}
              className={`p-2 rounded-full transition-colors text-zinc-400 ${
                isCurrentFuture ? 'opacity-30 pointer-events-none' : 'hover:bg-zinc-800 active:bg-zinc-700'
              }`}
              aria-label="次の日"
            >
              ›
            </button>
          </div>
        </div>

        {/* 進捗バー */}
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500 font-mono">{completedCount}/{totalCount}</span>
          </div>
        )}
      </div>

      {/* タスクリスト */}
      <div className="flex-1 overflow-y-auto px-4 py-1 flex flex-col">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-zinc-600 text-sm gap-2 py-20">
            <span className="text-4xl">✦</span>
            <p>タスクがまだありません</p>
            <p className="text-xs">タスクメニューから追加してください</p>
          </div>
        ) : (
          visibleTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              status={getStatus(currentDate, task.id)}
              history={history}
              dateStr={currentDate}
              onComplete={handleComplete}
              onSkip={handleSkip}
            />
          ))
        )}
      </div>

    </div>
  );
}
