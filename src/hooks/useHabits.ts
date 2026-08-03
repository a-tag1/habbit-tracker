import { useState, useCallback } from 'react';
import type { AppData, Task, TaskStatus } from '../types';
import { loadData, saveData, createTask, upsertHistory } from '../utils/storage';

export function useHabits() {
  const [data, setData] = useState<AppData>(() => loadData());

  const persist = useCallback((next: AppData) => {
    setData(next);
    saveData(next);
  }, []);

  const addTask = useCallback((title: string, frequencyType: Task['frequencyType'], frequencyCount: number, icon?: string, weekDays?: number[]) => {
    const order = data.tasks.length;
    const task = createTask(title, frequencyType, frequencyCount, order, icon, weekDays);
    persist({ ...data, tasks: [...data.tasks, task] });
  }, [data, persist]);

  const updateTask = useCallback((id: string, updates: Partial<Pick<Task, 'title' | 'frequencyType' | 'frequencyCount' | 'icon' | 'weekDays'>>) => {
    const tasks = data.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    persist({ ...data, tasks });
  }, [data, persist]);

  const deleteTask = useCallback((id: string) => {
    const tasks = data.tasks.filter(t => t.id !== id).map((t, i) => ({ ...t, order: i }));
    const history = data.history.filter(h => h.taskId !== id);
    persist({ ...data, tasks, history });
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

  const importAppData = useCallback((imported: AppData) => {
    persist(imported);
  }, [persist]);

  const sortedTasks = [...data.tasks].sort((a, b) => a.order - b.order);

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
    importAppData,
  };
}
