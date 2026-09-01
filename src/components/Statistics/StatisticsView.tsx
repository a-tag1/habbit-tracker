import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { Task, HistoryEntry } from '../../types';
import { getMonthlyStatistics, getNumberStatistics } from '../../utils/statistics';
import { getMonthRange } from '../../utils/dateUtils';

type RangeType = '1M' | '3M' | '6M';

interface Props {
  tasks: Task[];
  history: HistoryEntry[];
  statsTaskOrder: string[];
  onStatsReorder: (order: string[]) => void;
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

export default function StatisticsView({ tasks, history, statsTaskOrder, onStatsReorder }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [range, setRange] = useState<RangeType>('1M');
  const [baseMonth, setBaseMonth] = useState(today);
  const [reorderMode, setReorderMode] = useState(false);

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

  const rangeStart = months[0];
  const rangeEnd = getMonthRange(baseMonth).end;

  const sortedStatsTasks = statsTaskOrder
    .map(id => tasks.find(t => t.id === id))
    .filter((t): t is Task => t !== undefined);

  const numberStats = getNumberStatistics(sortedStatsTasks, history, rangeStart, rangeEnd);
  const hasNumberTasks = numberStats.length > 0;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(statsTaskOrder);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    onStatsReorder(reordered);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* 基準月ナビゲーション */}
      <div className="nav-surface px-4 pt-4 pb-2 flex items-center justify-between">
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
      <div className="nav-surface px-4 pb-3 border-b border-zinc-800 flex items-center gap-2">
        <div className="flex gap-2 flex-1">
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
        <button
          onClick={() => setReorderMode(v => !v)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            reorderMode
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {reorderMode ? '完了' : '並替'}
        </button>
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
                {reorderMode && <div className="w-5" />}
                {months.map(m => (
                  <div key={m} className={`${colW} text-center text-xs text-zinc-500 shrink-0`}>
                    {shortMonth(m)}
                  </div>
                ))}
              </div>
            )}

            {/* タスク行 */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="stats-tasks">
                {provided => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {sortedStatsTasks.map((task, index) => {
                      const monthStats = months.map(m => {
                        const s = getMonthlyStatistics([task], history, m)[0];
                        return { month: m, achievementRate: s.achievementRate, completedCount: s.completedCount, targetCount: s.targetCount };
                      });
                      const latest = monthStats[monthStats.length - 1];

                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!reorderMode}>
                          {(prov, snapshot) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              className={`flex items-center py-2.5 border-b border-zinc-800/60 last:border-0 ${
                                snapshot.isDragging ? 'opacity-80 bg-zinc-800 rounded-lg' : ''
                              }`}
                            >
                              {reorderMode && (
                                <div
                                  {...prov.dragHandleProps}
                                  className="text-zinc-600 cursor-grab active:cursor-grabbing select-none pr-2 text-xs shrink-0"
                                >
                                  ⋮⋮
                                </div>
                              )}
                              <p className="flex-1 text-sm truncate mr-2 text-zinc-100">{task.title}</p>
                              {!reorderMode && (range === '1M' ? (
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
                              ))}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* 数値記録セクション */}
            {hasNumberTasks && (
              <div className="mt-4 mb-2">
                <p className="text-xs font-medium text-zinc-500 mb-3 pt-2 border-t border-zinc-800">数値記録</p>
                {numberStats.map(stat => (
                  <div key={stat.taskId} className="bg-zinc-800/50 rounded-xl px-4 py-3 mb-2">
                    <p className="text-sm font-medium text-zinc-200 mb-2 truncate">{stat.title}</p>
                    {stat.count > 0 ? (
                      <div className="flex items-end gap-5">
                        <div className="text-center">
                          <p className="text-xl font-mono font-semibold text-emerald-400 leading-tight">{stat.avg}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">平均</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-mono font-semibold text-zinc-100 leading-tight">{stat.max}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">最大</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-mono font-semibold text-zinc-100 leading-tight">{stat.min}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">最小</p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-sm font-mono text-zinc-400 leading-tight">{stat.count}日</p>
                          <p className="text-xs text-zinc-600 mt-0.5">記録</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-600">記録なし</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
