import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppData, Task, TaskStatus } from '../types';
import { loadData, saveData, defaultAppData, createTask, upsertHistory, upsertHistoryMemo, upsertHistoryNumber } from '../utils/storage';

export function useHabits() {
  const [data, setData] = useState<AppData>(defaultAppData);
  const dataRef = useRef(defaultAppData);
  const loadedRef = useRef(false);

  useEffect(() => {
    loadData().then(d => {
      dataRef.current = d;
      setData(d);
      loadedRef.current = true;
    });
  }, []);

  const persist = useCallback((updater: (prev: AppData) => AppData) => {
    const next = updater(dataRef.current);
    dataRef.current = next;
    setData(next);
    if (loadedRef.current) {
      saveData(next);
    }
  }, []);

  const addTask = useCallback((title: string, frequencyType: Task['frequencyType'], frequencyCount: number, icon?: string, weekDays?: number[], difficulty?: Task['difficulty'], memoEnabled?: boolean, numberEnabled?: boolean) => {
    persist(prev => {
      const order = prev.tasks.length;
      const task = createTask(title, frequencyType, frequencyCount, order, icon, weekDays, difficulty, memoEnabled, numberEnabled);
      return { ...prev, tasks: [...prev.tasks, task] };
    });
  }, [persist]);

  const updateTask = useCallback((id: string, updates: Partial<Pick<Task, 'title' | 'frequencyType' | 'frequencyCount' | 'icon' | 'weekDays' | 'difficulty' | 'memoEnabled' | 'numberEnabled' | 'paused'>>) => {
    persist(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  }, [persist]);

  const deleteTask = useCallback((id: string) => {
    persist(prev => {
      const tasks = prev.tasks.filter(t => t.id !== id).map((t, i) => ({ ...t, order: i }));
      const history = prev.history.filter(h => h.taskId !== id);
      const statsTaskOrder = (prev.statsTaskOrder ?? []).filter(sid => sid !== id);
      return { ...prev, tasks, history, statsTaskOrder };
    });
  }, [persist]);

  const reorderTasks = useCallback((tasks: Task[]) => {
    persist(prev => ({
      ...prev,
      tasks: tasks.map((t, i) => ({ ...t, order: i })),
    }));
  }, [persist]);

  const setStatus = useCallback((date: string, taskId: string, status: TaskStatus) => {
    persist(prev => ({
      ...prev,
      history: upsertHistory(prev.history, date, taskId, status),
    }));
  }, [persist]);

  const getStatusForDate = useCallback((date: string, taskId: string): TaskStatus => {
    const entry = dataRef.current.history.find(h => h.date === date && h.taskId === taskId);
    return entry ? entry.status : 'pending';
  }, []);

  const setMemo = useCallback((date: string, taskId: string, memo: string) => {
    persist(prev => ({
      ...prev,
      history: upsertHistoryMemo(prev.history, date, taskId, memo),
    }));
  }, [persist]);

  const getMemoForDate = useCallback((date: string, taskId: string): string => {
    return dataRef.current.history.find(h => h.date === date && h.taskId === taskId)?.memo ?? '';
  }, []);

  const setNumber = useCallback((date: string, taskId: string, number: number | undefined) => {
    persist(prev => ({
      ...prev,
      history: upsertHistoryNumber(prev.history, date, taskId, number),
    }));
  }, [persist]);

  const getNumberForDate = useCallback((date: string, taskId: string): number | undefined => {
    return dataRef.current.history.find(h => h.date === date && h.taskId === taskId)?.number;
  }, []);

  const importAppData = useCallback((imported: AppData) => {
    persist(() => imported);
  }, [persist]);

  const setStatsTaskOrder = useCallback((order: string[]) => {
    persist(prev => ({ ...prev, statsTaskOrder: order }));
  }, [persist]);

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
