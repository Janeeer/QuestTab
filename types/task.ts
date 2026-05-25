export type TaskStatus = 'inbox' | 'today' | 'in_progress' | 'done';
export type QuestColumn = 'boss' | 'main' | 'side';

export interface Task {
  id: string;
  title: string;
  url: string;
  domain: string;
  description?: string;
  favicon?: string;
  ogImage?: string;

  why: string;
  successCriteria: string;

  status: TaskStatus;
  column?: QuestColumn;        // undefined when status is 'inbox'

  activeSeconds: number;
  trackedTabId?: number;       // set by background on Start, cleared on Done

  createdAt: number;           // Date.now()
  updatedAt: number;
}

export interface StorageSchema {
  tasks: Task[];
}
