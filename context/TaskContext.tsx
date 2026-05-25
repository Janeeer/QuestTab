import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Task, QuestColumn } from '../types/task';
import { getTasks, setTasks } from '../utils/storage';

interface TaskContextValue {
  tasks: Task[];
  addTask: (
    data: Omit<Task, 'id' | 'status' | 'activeSeconds' | 'createdAt' | 'updatedAt'>,
    toToday?: boolean
  ) => Promise<void>;
  moveToToday: (taskId: string, column?: QuestColumn) => Promise<void>;
  moveToInbox: (taskId: string) => Promise<void>;
  moveColumn: (taskId: string, column: QuestColumn) => Promise<void>;
  startTask: (taskId: string, tabId: number) => Promise<void>;
  markDone: (taskId: string) => Promise<void>;
  editTask: (taskId: string, patch: Partial<Pick<Task, 'title' | 'why' | 'successCriteria'>>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskContextProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasksState] = useState<Task[]>([]);

  useEffect(() => {
    getTasks().then(setTasksState);
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.tasks) setTasksState((changes.tasks.newValue as Task[]) ?? []);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const persist = async (updater: (prev: Task[]) => Task[]) => {
    const next = updater(tasks);
    setTasksState(next);
    await setTasks(next);
  };

  const addTask = async (
    data: Omit<Task, 'id' | 'status' | 'activeSeconds' | 'createdAt' | 'updatedAt'>,
    toToday = false
  ) => {
    const task: Task = {
      ...data,
      id: crypto.randomUUID(),
      status: toToday ? 'today' : 'inbox',
      column: toToday ? 'main' : undefined,
      activeSeconds: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await persist(prev => [...prev, task]);
  };

  const moveToToday = async (taskId: string, column: QuestColumn = 'main') =>
    persist(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'today', column, updatedAt: Date.now() } : t
    ));

  const moveToInbox = async (taskId: string) =>
    persist(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'inbox', column: undefined, updatedAt: Date.now() } : t
    ));

  const moveColumn = async (taskId: string, column: QuestColumn) =>
    persist(prev => prev.map(t =>
      t.id === taskId ? { ...t, column, updatedAt: Date.now() } : t
    ));

  const startTask = async (taskId: string, tabId: number) =>
    persist(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'in_progress', trackedTabId: tabId, updatedAt: Date.now() } : t
    ));

  const markDone = async (taskId: string) =>
    persist(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'done', trackedTabId: undefined, updatedAt: Date.now() } : t
    ));

  const editTask = async (taskId: string, patch: Partial<Pick<Task, 'title' | 'why' | 'successCriteria'>>) =>
    persist(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...patch, updatedAt: Date.now() } : t
    ));

  const deleteTask = async (taskId: string) =>
    persist(prev => prev.filter(t => t.id !== taskId));

  return (
    <TaskContext.Provider value={{ tasks, addTask, moveToToday, moveToInbox, moveColumn, startTask, markDone, editTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used within TaskContextProvider');
  return ctx;
}
