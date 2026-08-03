import { useState } from 'react';
import type { Task, HistoryEntry } from '../../types';
import { getMonthlyStatistics } from '../../utils/statistics';

type RangeType = '1M' | '3M' | '6M';

interface Props {
  tasks: Task[];
  history: HistoryEntry[];
}

function getMonthList(baseMonth: string, range: RangeType): string[] {
  const count = range === '1M' ? 1 : range === '3M' ? 3 : 6;
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(baseMonth.slice(0, 7) + '-01');
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 10));
  }
  return months;
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr.slice(0, 7) + '-01');
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

function shortMonth(dateStr: string): string {
  const d = new Date(dateStr.slice(0, 7) + '-01');
  return `${d.getMonth() + 1}月`;
}

const RANGE_LABELS: { value: RangeType; label: string }[] = [
  { value: '1M', label: '1か月' },
  { value: '3M', label: '3か月' },
  { value: '6M', label: '6か月' },
];

export default function StatisticsView({ tasks, history }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [range, setRange] = useState<RangeType>('1M');
  const [baseMonth, setBaseMonth] = useState(today);

  const isCurrentMonth = baseMonth.slice(0, 7) === today.slice(0, 7);

  const goPrev = () => setBaseMonth(prev => {
    const d = new Date(prev.slice(0, 7) + '-01');
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });

  const goNext = () => {
    if (isCurrentMonth) return;
    setBaseMonth(prev => {
      const d = new Date(prev.slice(0, 7) + '-01');
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().slice(0, 10);
    });
  };

  const months = getMonthList(baseMonth, range);
  const colW = range === '6M' ? 'w-10' : 'w-12';

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* 基準月ナビゲーション */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <button onClick={goPrev} className="p-2 text-zinc-400 hover:text-zinc-100">‹</button>
        <span className="font-semibold text-sm text-zinc-100">{formatMonth(baseMonth)}</span>
        <button
          onClick={goNext}
          className={`p-2 text-zinc-400 hover:text-zinc-100 transition-opacity ${isCurrentMonth ? 'opacity-30 pointer-events-none' : ''}`}
        >
          ›
        </button>
      </div>

      {/* 期間セレクター */}
      <div className="px-4 pb-3 border-b border-zinc-800 flex items-center justify-center gap-2">
        {RANGE_LABELS.map(r => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              range === r.value
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600 text-sm gap-2">
            <span className="text-4xl">✦</span>
            <p>タスクがありません</p>
          </div>
        ) : (
          <div className="px-4">
            {/* 月ヘッダー行（3M/6Mのみ） */}
            {range !== '1M' && (
              <div className="flex items-center py-2 border-b border-zinc-700">
                <div className="flex-1" />
                {months.map(m => (
                  <div key={m} className={`${colW} text-center text-xs text-zinc-500 shrink-0`}>
                    {shortMonth(m)}
                  </div>
                ))}
              </div>
            )}

            {/* タスク行 */}
            {tasks.map(task => {
              const monthStats = months.map(m => {
                const s = getMonthlyStatistics([task], history, m)[0];
                return { month: m, achievementRate: s.achievementRate, completedCount: s.completedCount, targetCount: s.targetCount };
              });
              const latest = monthStats[monthStats.length - 1];

              return (
                <div key={task.id} className="flex items-center py-2.5 border-b border-zinc-800/60 last:border-0">
                  <p className="flex-1 text-sm truncate mr-2 text-zinc-100">{task.title}</p>
                  {range === '1M' ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-mono text-zinc-500">
                        {latest.completedCount}/{latest.targetCount}
                      </span>
                      <span className="text-sm font-mono font-semibold text-emerald-400">
                        {latest.achievementRate}%
                      </span>
                    </div>
                  ) : (
                    monthStats.map((ms, i) => {
                      const isLatest = i === monthStats.length - 1;
                      return (
                        <div key={ms.month} className={`${colW} text-center shrink-0`}>
                          <span className={`text-xs font-mono ${isLatest ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {ms.completedCount}/{ms.targetCount}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
