import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppData, Task, TaskStatus } from '../types';
import { loadData, saveData, defaultAppData, createTask, upsertHistory, upsertHistoryMemo, upsertHistoryNumber } from '../utils/storage';

export function useHabits() {
  const [data, setData] = useState<AppData>(defaultAppData);
  const loadedRef = useRef(false);

  useEffect(() => {
    loadData().then(d => {
      setData(d);
      loadedRef.current = true;
    });
  }, []);

  const persist = useCallback((next: AppData) => {
    setData(next);
    if (loadedRef.current) {
      saveData(next);
    }
  }, []);

  const addTask = useCallback((title: string, frequencyType: Task['frequencyType'], frequencyCount: number, icon?: string, weekDays?: number[], difficulty?: Task['difficulty'], memoEnabled?: boolean, numberEnabled?: boolean) => {
    const order = data.tasks.length;
    const task = createTask(title, frequencyType, frequencyCount, order, icon, weekDays, difficulty, memoEnabled, numberEnabled);
    persist({ ...data, tasks: [...data.tasks, task] });
  }, [data, persist]);

  const updateTask = useCallback((id: string, updates: Partial<Pick<Task, 'title' | 'frequencyType' | 'frequencyCount' | 'icon' | 'weekDays' | 'difficulty' | 'memoEnabled' | 'numberEnabled'>>) => {
    const tasks = data.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    persist({ ...data, tasks });
  }, [data, persist]);

  const deleteTask = useCallback((id: string) => {
    const tasks = data.tasks.filter(t => t.id !== id).map((t, i) => ({ ...t, order: i }));
    const history = data.history.filter(h => h.taskId !== id);
    const statsTaskOrder = (data.statsTaskOrder ?? []).filter(sid => sid !== id);
    persist({ ...data, tasks, history, statsTaskOrder });
  }, [data, persist]);

  const reorderTasks = useCallback((tasks: Task[]) => {
    const reordered = tasks.map((t, i) => ({ ...t, order: i }));
    persist({ ...data, tasks: reordered });
  }, [data, persist]);

  const setStatus = useCallback((date: string, taskId: string, status: TaskStatus) => {
    const history = upsertHistory(data.history, date, taskId, status);
    persist({ ...data, history });
  }, [data, persist]);

  const getStatusForDate = useCallback((date: string, taskId: string): TaskStatus => {
    const entry = data.history.find(h => h.date === date && h.taskId === taskId);
    return entry ? entry.status : 'pending';
  }, [data.history]);

  const setMemo = useCallback((date: string, taskId: string, memo: string) => {
    const history = upsertHistoryMemo(data.history, date, taskId, memo);
    persist({ ...data, history });
  }, [data, persist]);

  const getMemoForDate = useCallback((date: string, taskId: string): string => {
    return data.history.find(h => h.date === date && h.taskId === taskId)?.memo ?? '';
  }, [data.history]);

  const setNumber = useCallback((date: string, taskId: string, number: number | undefined) => {
    const history = upsertHistoryNumber(data.history, date, taskId, number);
    persist({ ...data, history });
  }, [data, persist]);

  const getNumberForDate = useCallback((date: string, taskId: string): number | undefined => {
    return data.history.find(h => h.date === date && h.taskId === taskId)?.number;
  }, [data.history]);

  const importAppData = useCallback((imported: AppData) => {
    persist(imported);
  }, [persist]);

  const setStatsTaskOrder = useCallback((order: string[]) => {
    persist({ ...data, statsTaskOrder: order });
  }, [data, persist]);

  const sortedTasks = [...data.tasks].sort((a, b) => a.order - b.order);

  // 統計タブ用の順序: 保存済み順 + 未登録タスクを末尾に追加
  const stored = data.statsTaskOrder ?? [];
  const existingIds = new Set(sortedTasks.map(t => t.id));
  const filteredOrder = stored.filter(id => existingIds.has(id));
  const newIds = sortedTasks.filter(t => !stored.includes(t.id)).map(t => t.id);
  const statsTaskOrder = [...filteredOrder, ...newIds];

  return {
    tasks: sortedTasks,
    history: data.history,
    data,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    setStatus,
    getStatusForDate,
    setMemo,
    getMemoForDate,
    setNumber,
    getNumberForDate,
    statsTaskOrder,
    setStatsTaskOrder,
    importAppData,
  };
}
