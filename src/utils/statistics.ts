import type { Task, HistoryEntry } from '../types';
import { getWeekRange, getMonthRange, getDaysInMonth, getDayOfWeek, isDateInRange } from './dateUtils';

/** 指定期間内の完了数を返す */
export function getCompletedCount(history: HistoryEntry[], taskId: string, start: string, end: string): number {
  return history.filter(h => h.taskId === taskId && h.status === 'completed' && isDateInRange(h.date, start, end)).length;
}

/** デイリー・週次・月次タスクの進捗カウンターを返す */
export function getProgressCounter(task: Task, history: HistoryEntry[], dateStr: string): { current: number; target: number } | null {
  const { start } = getMonthRange(dateStr);
  const current = getCompletedCount(history, task.id, start, dateStr);

  if (task.frequencyType === 'daily') {
    return {
      current,
      target: getDaysInMonth(dateStr).length,
    };
  }

  if (task.frequencyType === 'weekly') {
    if (task.weekDays && task.weekDays.length > 0) {
      const target = getDaysInMonth(dateStr).filter(d =>
        task.weekDays!.includes(new Date(d + 'T12:00:00').getDay())
      ).length;
      return { current, target };
    }
    const weeksInMonth = new Set(getDaysInMonth(dateStr).map(d => getWeekRange(d).start)).size;
    return { current, target: task.frequencyCount * weeksInMonth };
  }

  if (task.frequencyType === 'monthly') {
    return { current, target: task.frequencyCount };
  }

  return null;
}

export interface TaskProgressRates {
  completedCount: number;
  monthlyTarget: number;
  expectedByDate: number;
  achievementRate: number;
  paceRate: number;
}

/** 月間目標に対する達成率と、選択日までの予定ペースに対する進捗率を返す */
export function getTaskProgressRates(task: Task, history: HistoryEntry[], dateStr: string): TaskProgressRates {
  const days = getDaysInMonth(dateStr);
  const daysThroughDate = days.filter(day => day <= dateStr);
  const completedCount = getCompletedCount(history, task.id, days[0], dateStr);
  let monthlyTarget: number;
  let expectedByDate: number;

  if (task.frequencyType === 'daily') {
    monthlyTarget = days.length;
    expectedByDate = daysThroughDate.length;
  } else if (task.frequencyType === 'weekly' && task.weekDays && task.weekDays.length > 0) {
    monthlyTarget = days.filter(day => task.weekDays!.includes(getDayOfWeek(day))).length;
    expectedByDate = daysThroughDate.filter(day => task.weekDays!.includes(getDayOfWeek(day))).length;
  } else if (task.frequencyType === 'weekly') {
    const weeksInMonth = new Set(days.map(day => getWeekRange(day).start)).size;
    const weeksThroughDate = new Set(daysThroughDate.map(day => getWeekRange(day).start)).size;
    monthlyTarget = task.frequencyCount * weeksInMonth;
    expectedByDate = task.frequencyCount * weeksThroughDate;
  } else {
    monthlyTarget = task.frequencyCount;
    expectedByDate = monthlyTarget * daysThroughDate.length / days.length;
  }

  return {
    completedCount,
    monthlyTarget,
    expectedByDate,
    achievementRate: monthlyTarget > 0 ? Math.round(completedCount / monthlyTarget * 100) : 0,
    paceRate: expectedByDate > 0 ? Math.round(completedCount / expectedByDate * 100) : 0,
  };
}

/** 月次統計：タスクごとの達成率を返す */
export interface TaskMonthStat {
  taskId: string;
  title: string;
  completedCount: number;
  targetCount: number;
  achievementRate: number;
  dailyStatus: { date: string; status: 'completed' | 'skipped' | 'none' }[];
}

export function getMonthlyStatistics(tasks: Task[], history: HistoryEntry[], monthDateStr: string): TaskMonthStat[] {
  const days = getDaysInMonth(monthDateStr);
  const today = new Date().toISOString().slice(0, 10);

  return tasks.map(task => {
    const { start, end } = getMonthRange(monthDateStr);
    const pastDays = days.filter(d => d <= today);
    const isCurrentMonth = monthDateStr.slice(0, 7) === today.slice(0, 7);

    let targetCount: number;
    if (task.frequencyType === 'daily') {
      // 月の総日数（当月なら当日まで、過去月なら全日数）
      targetCount = isCurrentMonth ? pastDays.length : days.length;
    } else if (task.frequencyType === 'weekly') {
      if (task.weekDays && task.weekDays.length > 0) {
        const relevantDays = isCurrentMonth ? pastDays : days;
        targetCount = relevantDays.filter(d =>
          task.weekDays!.includes(new Date(d + 'T12:00:00').getDay())
        ).length;
      } else {
        targetCount = 4 * task.frequencyCount; // 旧データの互换性
      }
    } else {
      targetCount = task.frequencyCount;
    }

    const completedCount = getCompletedCount(history, task.id, start, end);
    const achievementRate = targetCount > 0 ? Math.round((completedCount / targetCount) * 100) : 0;

    const dailyStatus = days.map(date => {
      const entry = history.find(h => h.taskId === task.id && h.date === date);
      return {
        date,
        status: (entry ? entry.status : 'none') as 'completed' | 'skipped' | 'none',
      };
    });

    return { taskId: task.id, title: task.title, completedCount, targetCount, achievementRate, dailyStatus };
  });
}

export interface TaskNumberStat {
  taskId: string;
  title: string;
  avg: number | null;
  max: number | null;
  min: number | null;
  count: number;
}

/** numberEnabled タスクの期間内 avg/max/min を返す */
export function getNumberStatistics(tasks: Task[], history: HistoryEntry[], start: string, end: string): TaskNumberStat[] {
  return tasks
    .filter(t => t.numberEnabled)
    .map(task => {
      const values = history
        .filter(h => h.taskId === task.id && isDateInRange(h.date, start, end) && h.number !== undefined)
        .map(h => h.number!);
      if (values.length === 0) {
        return { taskId: task.id, title: task.title, avg: null, max: null, min: null, count: 0 };
      }
      const sum = values.reduce((a, b) => a + b, 0);
      return {
        taskId: task.id,
        title: task.title,
        avg: Math.round((sum / values.length) * 10) / 10,
        max: Math.max(...values),
        min: Math.min(...values),
        count: values.length,
      };
    });
}
