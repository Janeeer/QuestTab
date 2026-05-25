import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Task, QuestColumn, TimeBlock } from '../types/task';
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
  startTask: (taskId: string) => Promise<void>;
  setTrackedTab: (taskId: string, tabId: number) => Promise<void>;
  markDone: (taskId: string) => Promise<void>;
  editTask: (taskId: string, patch: Partial<Pick<Task, 'title' | 'why' | 'successCriteria'>>) => Promise<void>;
  assignTimeBlock: (taskId: string, block: TimeBlock) => Promise<void>;
  removeTimeBlock: (taskId: string, block: TimeBlock) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | null>(null);

// Backfill fields added after initial release so old stored tasks don't crash
function migrate(t: Task): Task {
  return { timeBlocks: [], ...t };
}

export function TaskContextProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasksState] = useState<Task[]>([]);
  const tasksRef = useRef<Task[]>([]);

  const setTasks_ = (next: Task[]) => {
    tasksRef.current = next;
    setTasksState(next);
  };

  useEffect(() => {
    getTasks().then(raw => setTasks_(raw.map(migrate)));
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.tasks) setTasks_(((changes.tasks.newValue as Task[]) ?? []).map(migrate));
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const persist = async (updater: (prev: Task[]) => Task[]) => {
    const next = updater(tasksRef.current);
    setTasks_(next);
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
      timeBlocks: [],
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

  const startTask = async (taskId: string) =>
    persist(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'in_progress', updatedAt: Date.now() } : t
    ));

  const setTrackedTab = async (taskId: string, tabId: number) =>
    persist(prev => prev.map(t =>
      t.id === taskId ? { ...t, trackedTabId: tabId, updatedAt: Date.now() } : t
    ));

  const markDone = async (taskId: string) =>
    persist(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'done', trackedTabId: undefined, updatedAt: Date.now() } : t
    ));

  const editTask = async (taskId: string, patch: Partial<Pick<Task, 'title' | 'why' | 'successCriteria'>>) =>
    persist(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...patch, updatedAt: Date.now() } : t
    ));

  const assignTimeBlock = async (taskId: string, block: TimeBlock) =>
    persist(prev => prev.map(t =>
      t.id === taskId && !t.timeBlocks.includes(block)
        ? { ...t, timeBlocks: [...t.timeBlocks, block], updatedAt: Date.now() }
        : t
    ));

  const removeTimeBlock = async (taskId: string, block: TimeBlock) =>
    persist(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, timeBlocks: t.timeBlocks.filter(b => b !== block), updatedAt: Date.now() }
        : t
    ));

  const deleteTask = async (taskId: string) =>
    persist(prev => prev.filter(t => t.id !== taskId));

  return (
    <TaskContext.Provider value={{ tasks, addTask, moveToToday, moveToInbox, moveColumn, startTask, setTrackedTab, markDone, editTask, assignTimeBlock, removeTimeBlock, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used within TaskContextProvider');
  return ctx;
}
