# QuestTab MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome Extension (MV3) that turns web pages into focused, trackable daily learning tasks with a New Tab Dashboard.

**Architecture:** WXT framework with React + TypeScript. A single `TaskContextProvider` owns all task state backed by `chrome.storage.local`. A background service worker tracks active tab time via `ActiveTimeTracker` (pure class, no Chrome deps). Drag-and-drop between Inbox sidebar and Boss/Main/Side columns uses `@dnd-kit/core`.

**Tech Stack:** WXT, React 18, TypeScript, CSS Modules, @dnd-kit/core, Vitest, @testing-library/react, chrome.storage.local, Manifest V3

---

## File Map

| File | Responsibility |
|---|---|
| `wxt.config.ts` | Extension manifest, permissions, modules |
| `vitest.config.ts` | Test runner config |
| `src/test-utils/setup.ts` | Chrome API mock + jest-dom setup |
| `types/task.ts` | Task interface, TaskStatus, QuestColumn |
| `utils/storage.ts` | Typed chrome.storage.local wrappers |
| `utils/tracker.ts` | Pure active-time tracking logic (no Chrome deps) |
| `context/TaskContext.tsx` | Global task state + storage sync |
| `entrypoints/background.ts` | Tab event listeners wired to tracker + storage |
| `entrypoints/popup/App.tsx` | Popup shell — fetches tab metadata, calls context |
| `entrypoints/popup/main.tsx` | React root for popup |
| `components/popup/SaveForm.tsx` | Save-page form (title, why, success criteria) |
| `components/popup/SaveForm.module.css` | Popup form styles |
| `entrypoints/newtab/index.html` | New tab HTML shell |
| `entrypoints/newtab/main.tsx` | React root for dashboard |
| `entrypoints/newtab/App.tsx` | Dashboard shell with DndContext + TaskContextProvider |
| `components/dashboard/Header.tsx` | Today title + inbox toggle button |
| `components/dashboard/Header.module.css` | Header styles |
| `components/dashboard/TaskCard.tsx` | Task card — renders status-appropriate actions |
| `components/dashboard/TaskCard.module.css` | Card styles (inbox/today/in_progress/done variants) |
| `components/dashboard/InboxSidebar.tsx` | Collapsible left panel, droppable inbox zone |
| `components/dashboard/InboxSidebar.module.css` | Sidebar styles |
| `components/dashboard/TimeBlocks.tsx` | Static Morning/Noon/Afternoon/Evening placeholder |
| `components/dashboard/TimeBlocks.module.css` | Time block styles |
| `components/dashboard/QuestColumn.tsx` | Droppable column (Boss / Main / Side) with draggable cards |
| `components/dashboard/QuestColumn.module.css` | Column styles |
| `components/dashboard/QuestBoard.tsx` | Three-column layout, no drag logic (DndContext is in App) |
| `components/dashboard/QuestBoard.module.css` | Board styles |

---

## Task 1: Project Scaffold

**Files:**
- Modify: `wxt.config.ts`
- Create: `vitest.config.ts`
- Create: `src/test-utils/setup.ts`

- [ ] **Step 1.1: Initialize WXT with React + TypeScript template**

```bash
npx wxt@latest init . --template react-ts
```

Confirm when prompted to initialize in the current directory. This creates `package.json`, `tsconfig.json`, `wxt.config.ts`, and example entrypoints. Existing files (`Product_SPECv1.md`, `docs/`) are untouched.

- [ ] **Step 1.2: Install additional runtime dependencies**

```bash
npm install @dnd-kit/core @dnd-kit/utilities
```

- [ ] **Step 1.3: Install test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 1.4: Replace wxt.config.ts with the following**

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'QuestTab',
    description: 'Daily learning quest planner — turn web pages into focused, trackable tasks',
    permissions: ['storage', 'tabs', 'scripting', 'activeTab'],
    host_permissions: ['<all_urls>'],
  },
});
```

- [ ] **Step 1.5: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/setup.ts'],
    globals: true,
  },
});
```

- [ ] **Step 1.6: Create src/test-utils/setup.ts**

```typescript
import '@testing-library/jest-dom';

let storage: Record<string, unknown> = {};

beforeEach(() => {
  storage = {};
  vi.clearAllMocks();
});

(global as any).chrome = {
  storage: {
    local: {
      get: vi.fn((keys: string | string[] | null, callback: (r: Record<string, unknown>) => void) => {
        if (typeof keys === 'string') {
          callback({ [keys]: storage[keys] });
        } else if (Array.isArray(keys)) {
          const result: Record<string, unknown> = {};
          (keys as string[]).forEach(k => { result[k] = storage[k]; });
          callback(result);
        } else {
          callback({ ...storage });
        }
      }),
      set: vi.fn((items: Record<string, unknown>, callback?: () => void) => {
        Object.assign(storage, items);
        callback?.();
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
    onActivated: { addListener: vi.fn() },
    onUpdated: { addListener: vi.fn() },
    onRemoved: { addListener: vi.fn() },
  },
  windows: {
    onFocusChanged: { addListener: vi.fn() },
    WINDOW_ID_NONE: -1,
  },
  scripting: {
    executeScript: vi.fn(),
  },
};
```

- [ ] **Step 1.7: Add TypeScript type references for globals**

Add a file `src/test-utils/globals.d.ts`:

```typescript
/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />
```

- [ ] **Step 1.8: Add test scripts to package.json**

In `package.json`, add to the `"scripts"` section:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 1.9: Delete WXT template example files we will not use**

```bash
rm -f assets/react.svg components/App.module.css components/Logo.tsx 2>/dev/null; true
```

- [ ] **Step 1.10: Verify the build compiles without errors**

```bash
npm run build
```

Expected: build output in `.output/` with no TypeScript errors. Warnings about unused variables from template files are acceptable.

- [ ] **Step 1.11: Commit**

```bash
git add -A
git commit -m "feat: scaffold WXT React TypeScript project with Vitest and dnd-kit"
```

---

## Task 2: Data Types

**Files:**
- Create: `types/task.ts`

- [ ] **Step 2.1: Create types/task.ts**

```typescript
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
```

- [ ] **Step 2.2: Commit**

```bash
git add types/task.ts
git commit -m "feat: add Task type definitions"
```

---

## Task 3: Storage Utilities

**Files:**
- Create: `utils/storage.ts`
- Create: `utils/storage.test.ts`

- [ ] **Step 3.1: Write the failing tests**

Create `utils/storage.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getTasks, setTasks, updateTask } from './storage';
import type { Task } from '../types/task';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Test Task',
  url: 'https://example.com',
  domain: 'example.com',
  why: 'To learn',
  successCriteria: 'Finished reading',
  status: 'inbox',
  activeSeconds: 0,
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
});

describe('getTasks', () => {
  it('returns empty array when storage is empty', async () => {
    const tasks = await getTasks();
    expect(tasks).toEqual([]);
  });

  it('returns tasks previously written to storage', async () => {
    await setTasks([makeTask()]);
    const result = await getTasks();
    expect(result).toEqual([makeTask()]);
  });
});

describe('setTasks', () => {
  it('writes multiple tasks and retrieves them', async () => {
    const tasks = [makeTask(), makeTask({ id: 'task-2', title: 'Second' })];
    await setTasks(tasks);
    const result = await getTasks();
    expect(result).toHaveLength(2);
    expect(result[1].id).toBe('task-2');
  });
});

describe('updateTask', () => {
  it('updates a single task by id', async () => {
    await setTasks([makeTask()]);
    await updateTask('task-1', { title: 'Updated' });
    const tasks = await getTasks();
    expect(tasks[0].title).toBe('Updated');
  });

  it('leaves other tasks untouched', async () => {
    await setTasks([makeTask(), makeTask({ id: 'task-2', title: 'Other' })]);
    await updateTask('task-1', { title: 'Changed' });
    const tasks = await getTasks();
    expect(tasks.find(t => t.id === 'task-2')?.title).toBe('Other');
  });

  it('sets updatedAt to current time', async () => {
    const before = Date.now();
    await setTasks([makeTask({ updatedAt: 0 })]);
    await updateTask('task-1', { title: 'New' });
    const tasks = await getTasks();
    expect(tasks[0].updatedAt).toBeGreaterThanOrEqual(before);
  });
});
```

- [ ] **Step 3.2: Run tests — confirm they fail**

```bash
npm run test:run -- utils/storage.test.ts
```

Expected: FAIL — `Cannot find module './storage'`

- [ ] **Step 3.3: Implement utils/storage.ts**

```typescript
import type { Task } from '../types/task';

export async function getTasks(): Promise<Task[]> {
  return new Promise(resolve => {
    chrome.storage.local.get(['tasks'], result => {
      resolve((result.tasks as Task[]) ?? []);
    });
  });
}

export async function setTasks(tasks: Task[]): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({ tasks }, () => resolve());
  });
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  const tasks = await getTasks();
  const updated = tasks.map(t =>
    t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t
  );
  await setTasks(updated);
}
```

- [ ] **Step 3.4: Run tests — confirm they pass**

```bash
npm run test:run -- utils/storage.test.ts
```

Expected: PASS — 6 tests

- [ ] **Step 3.5: Commit**

```bash
git add utils/storage.ts utils/storage.test.ts
git commit -m "feat: add typed chrome.storage utilities"
```

---

## Task 4: Active Time Tracker

**Files:**
- Create: `utils/tracker.ts`
- Create: `utils/tracker.test.ts`

- [ ] **Step 4.1: Write the failing tests**

Create `utils/tracker.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActiveTimeTracker } from './tracker';

describe('ActiveTimeTracker', () => {
  let tracker: ActiveTimeTracker;

  beforeEach(() => {
    tracker = new ActiveTimeTracker();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports not tracking before startTick', () => {
    expect(tracker.isTracking('task-1')).toBe(false);
  });

  it('reports tracking after startTick', () => {
    tracker.startTick('task-1');
    expect(tracker.isTracking('task-1')).toBe(true);
  });

  it('returns 0 for a task never tracked', () => {
    expect(tracker.stopTick('task-1')).toBe(0);
  });

  it('returns elapsed seconds on stopTick', () => {
    tracker.startTick('task-1');
    vi.advanceTimersByTime(5000);
    expect(tracker.stopTick('task-1')).toBe(5);
  });

  it('stops tracking after stopTick', () => {
    tracker.startTick('task-1');
    tracker.stopTick('task-1');
    expect(tracker.isTracking('task-1')).toBe(false);
  });

  it('ignores duplicate startTick — counts from the first call', () => {
    tracker.startTick('task-1');
    vi.advanceTimersByTime(3000);
    tracker.startTick('task-1');
    vi.advanceTimersByTime(2000);
    expect(tracker.stopTick('task-1')).toBe(5);
  });

  it('stopAll returns seconds for every tracked task', () => {
    tracker.startTick('task-1');
    tracker.startTick('task-2');
    vi.advanceTimersByTime(4000);
    const results = tracker.stopAll();
    expect(results).toHaveLength(2);
    expect(results.every(r => r.seconds === 4)).toBe(true);
  });

  it('stopAll clears all tracking state', () => {
    tracker.startTick('task-1');
    tracker.stopAll();
    expect(tracker.isTracking('task-1')).toBe(false);
  });
});
```

- [ ] **Step 4.2: Run tests — confirm they fail**

```bash
npm run test:run -- utils/tracker.test.ts
```

Expected: FAIL — `Cannot find module './tracker'`

- [ ] **Step 4.3: Implement utils/tracker.ts**

```typescript
export class ActiveTimeTracker {
  private tickMap = new Map<string, number>(); // taskId → start timestamp ms

  startTick(taskId: string): void {
    if (!this.tickMap.has(taskId)) {
      this.tickMap.set(taskId, Date.now());
    }
  }

  stopTick(taskId: string): number {
    const start = this.tickMap.get(taskId);
    if (start == null) return 0;
    this.tickMap.delete(taskId);
    return Math.floor((Date.now() - start) / 1000);
  }

  stopAll(): Array<{ taskId: string; seconds: number }> {
    const results: Array<{ taskId: string; seconds: number }> = [];
    for (const taskId of Array.from(this.tickMap.keys())) {
      results.push({ taskId, seconds: this.stopTick(taskId) });
    }
    return results;
  }

  isTracking(taskId: string): boolean {
    return this.tickMap.has(taskId);
  }
}
```

- [ ] **Step 4.4: Run tests — confirm they pass**

```bash
npm run test:run -- utils/tracker.test.ts
```

Expected: PASS — 8 tests

- [ ] **Step 4.5: Commit**

```bash
git add utils/tracker.ts utils/tracker.test.ts
git commit -m "feat: add pure active-time tracker class"
```

---

## Task 5: Task Context

**Files:**
- Create: `context/TaskContext.tsx`
- Create: `context/TaskContext.test.tsx`

- [ ] **Step 5.1: Write the failing tests**

Create `context/TaskContext.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import { TaskContextProvider, useTaskContext } from './TaskContext';

function Consumer() {
  const { tasks, addTask, moveToToday, moveColumn, moveToInbox, markDone, deleteTask } = useTaskContext();
  const first = tasks[0];
  return (
    <div>
      <span data-testid="count">{tasks.length}</span>
      <span data-testid="status">{first?.status ?? 'none'}</span>
      <span data-testid="column">{first?.column ?? 'none'}</span>
      <button onClick={() => addTask({ title: 'T', url: 'https://a.com', domain: 'a.com', why: 'W', successCriteria: 'S' })}>add</button>
      <button onClick={() => addTask({ title: 'T', url: 'https://a.com', domain: 'a.com', why: 'W', successCriteria: 'S' }, true)}>addToday</button>
      <button onClick={() => first && moveToToday(first.id, 'boss')}>moveToday</button>
      <button onClick={() => first && moveColumn(first.id, 'side')}>moveCol</button>
      <button onClick={() => first && moveToInbox(first.id)}>moveInbox</button>
      <button onClick={() => first && markDone(first.id)}>done</button>
      <button onClick={() => first && deleteTask(first.id)}>delete</button>
    </div>
  );
}

function wrap() {
  return render(<TaskContextProvider><Consumer /></TaskContextProvider>);
}

describe('TaskContext', () => {
  it('starts with no tasks', () => {
    wrap();
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('addTask creates an inbox task', async () => {
    wrap();
    await act(async () => { screen.getByText('add').click(); });
    expect(screen.getByTestId('status').textContent).toBe('inbox');
    expect(screen.getByTestId('column').textContent).toBe('none');
  });

  it('addTask with toToday=true creates a today/main task', async () => {
    wrap();
    await act(async () => { screen.getByText('addToday').click(); });
    expect(screen.getByTestId('status').textContent).toBe('today');
    expect(screen.getByTestId('column').textContent).toBe('main');
  });

  it('moveToToday sets status and column', async () => {
    wrap();
    await act(async () => { screen.getByText('add').click(); });
    await act(async () => { screen.getByText('moveToday').click(); });
    expect(screen.getByTestId('status').textContent).toBe('today');
    expect(screen.getByTestId('column').textContent).toBe('boss');
  });

  it('moveColumn updates column only', async () => {
    wrap();
    await act(async () => { screen.getByText('add').click(); });
    await act(async () => { screen.getByText('moveToday').click(); });
    await act(async () => { screen.getByText('moveCol').click(); });
    expect(screen.getByTestId('column').textContent).toBe('side');
  });

  it('moveToInbox clears column', async () => {
    wrap();
    await act(async () => { screen.getByText('add').click(); });
    await act(async () => { screen.getByText('moveToday').click(); });
    await act(async () => { screen.getByText('moveInbox').click(); });
    expect(screen.getByTestId('status').textContent).toBe('inbox');
    expect(screen.getByTestId('column').textContent).toBe('none');
  });

  it('markDone sets status to done', async () => {
    wrap();
    await act(async () => { screen.getByText('add').click(); });
    await act(async () => { screen.getByText('done').click(); });
    expect(screen.getByTestId('status').textContent).toBe('done');
  });

  it('deleteTask removes the task', async () => {
    wrap();
    await act(async () => { screen.getByText('add').click(); });
    await act(async () => { screen.getByText('delete').click(); });
    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});
```

- [ ] **Step 5.2: Run tests — confirm they fail**

```bash
npm run test:run -- context/TaskContext.test.tsx
```

Expected: FAIL — `Cannot find module './TaskContext'`

- [ ] **Step 5.3: Implement context/TaskContext.tsx**

```typescript
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
```

- [ ] **Step 5.4: Run tests — confirm they pass**

```bash
npm run test:run -- context/TaskContext.test.tsx
```

Expected: PASS — 8 tests

- [ ] **Step 5.5: Commit**

```bash
git add context/TaskContext.tsx context/TaskContext.test.tsx
git commit -m "feat: add TaskContext with optimistic storage-backed state"
```

---

## Task 6: Background Service Worker

**Files:**
- Create: `entrypoints/background.ts`

- [ ] **Step 6.1: Create entrypoints/background.ts**

`defineBackground` is a WXT auto-import — no import statement needed.

```typescript
import { ActiveTimeTracker } from '../utils/tracker';
import { getTasks, updateTask } from '../utils/storage';
import type { Task } from '../types/task';

export default defineBackground(() => {
  const tracker = new ActiveTimeTracker();
  let windowFocused = true;

  async function getInProgress(): Promise<Task[]> {
    const tasks = await getTasks();
    return tasks.filter(t => t.status === 'in_progress' && t.trackedTabId != null);
  }

  async function stopAndSave(taskId: string) {
    const seconds = tracker.stopTick(taskId);
    if (seconds <= 0) return;
    const tasks = await getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await updateTask(taskId, { activeSeconds: task.activeSeconds + seconds });
  }

  async function syncActiveTab(tabId: number) {
    const inProgress = await getInProgress();
    for (const task of inProgress) {
      if (task.trackedTabId === tabId && windowFocused) {
        tracker.startTick(task.id);
      } else if (tracker.isTracking(task.id)) {
        await stopAndSave(task.id);
      }
    }
  }

  chrome.tabs.onActivated.addListener(({ tabId }) => {
    syncActiveTab(tabId);
  });

  chrome.tabs.onRemoved.addListener(async tabId => {
    const inProgress = await getInProgress();
    for (const task of inProgress) {
      if (task.trackedTabId === tabId) await stopAndSave(task.id);
    }
  });

  chrome.windows.onFocusChanged.addListener(async windowId => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      windowFocused = false;
      const stopped = tracker.stopAll();
      for (const { taskId, seconds } of stopped) {
        if (seconds > 0) {
          const tasks = await getTasks();
          const task = tasks.find(t => t.id === taskId);
          if (task) await updateTask(taskId, { activeSeconds: task.activeSeconds + seconds });
        }
      }
    } else {
      windowFocused = true;
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0]?.id != null) syncActiveTab(tabs[0].id);
      });
    }
  });
});
```

- [ ] **Step 6.2: Commit**

```bash
git add entrypoints/background.ts
git commit -m "feat: add background service worker for active tab time tracking"
```

---

## Task 7: Popup Save Form

**Files:**
- Create: `components/popup/SaveForm.tsx`
- Create: `components/popup/SaveForm.module.css`
- Create: `components/popup/SaveForm.test.tsx`
- Replace: `entrypoints/popup/App.tsx`
- Replace: `entrypoints/popup/main.tsx`

- [ ] **Step 7.1: Write the failing tests**

Create `components/popup/SaveForm.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveForm } from './SaveForm';

const baseProps = {
  initialTitle: 'Test Page',
  url: 'https://example.com',
  domain: 'example.com',
  onSaveToInbox: vi.fn(),
  onAddToToday: vi.fn(),
};

describe('SaveForm', () => {
  it('renders title and domain', () => {
    render(<SaveForm {...baseProps} />);
    expect(screen.getByDisplayValue('Test Page')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('disables buttons when fields are empty', () => {
    render(<SaveForm {...baseProps} />);
    expect(screen.getByText('Save to Inbox')).toBeDisabled();
    expect(screen.getByText('Add to Today')).toBeDisabled();
  });

  it('enables buttons when both fields are filled', async () => {
    render(<SaveForm {...baseProps} />);
    await userEvent.type(screen.getByPlaceholderText(/why/i), 'Learn');
    await userEvent.type(screen.getByPlaceholderText(/success/i), 'Done');
    expect(screen.getByText('Save to Inbox')).not.toBeDisabled();
    expect(screen.getByText('Add to Today')).not.toBeDisabled();
  });

  it('calls onSaveToInbox with form data', async () => {
    const onSaveToInbox = vi.fn();
    render(<SaveForm {...baseProps} onSaveToInbox={onSaveToInbox} />);
    await userEvent.type(screen.getByPlaceholderText(/why/i), 'Learn');
    await userEvent.type(screen.getByPlaceholderText(/success/i), 'Done');
    await userEvent.click(screen.getByText('Save to Inbox'));
    expect(onSaveToInbox).toHaveBeenCalledWith({ title: 'Test Page', why: 'Learn', successCriteria: 'Done' });
  });

  it('calls onAddToToday with form data', async () => {
    const onAddToToday = vi.fn();
    render(<SaveForm {...baseProps} onAddToToday={onAddToToday} />);
    await userEvent.type(screen.getByPlaceholderText(/why/i), 'Learn');
    await userEvent.type(screen.getByPlaceholderText(/success/i), 'Done');
    await userEvent.click(screen.getByText('Add to Today'));
    expect(onAddToToday).toHaveBeenCalledWith({ title: 'Test Page', why: 'Learn', successCriteria: 'Done' });
  });
});
```

- [ ] **Step 7.2: Run tests — confirm they fail**

```bash
npm run test:run -- components/popup/SaveForm.test.tsx
```

Expected: FAIL — `Cannot find module './SaveForm'`

- [ ] **Step 7.3: Implement components/popup/SaveForm.tsx**

```typescript
import { useState } from 'react';
import styles from './SaveForm.module.css';

interface FormData {
  title: string;
  why: string;
  successCriteria: string;
}

interface SaveFormProps {
  initialTitle: string;
  url: string;
  domain: string;
  favicon?: string;
  onSaveToInbox: (data: FormData) => void;
  onAddToToday: (data: FormData) => void;
}

export function SaveForm({ initialTitle, url, domain, favicon, onSaveToInbox, onAddToToday }: SaveFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [why, setWhy] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');

  const isValid = why.trim().length > 0 && successCriteria.trim().length > 0;
  const formData: FormData = { title: title.trim(), why: why.trim(), successCriteria: successCriteria.trim() };

  return (
    <div className={styles.form}>
      <div className={styles.pageInfo}>
        {favicon && <img src={favicon} alt="" className={styles.favicon} />}
        <div className={styles.pageMeta}>
          <input className={styles.titleInput} value={title} onChange={e => setTitle(e.target.value)} />
          <div className={styles.domain}>{domain}</div>
          <div className={styles.url} title={url}>{url}</div>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Why learn / process this?</label>
        <textarea
          className={styles.textarea}
          placeholder="Why do you want to learn this?"
          value={why}
          onChange={e => setWhy(e.target.value)}
          rows={3}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Success criteria</label>
        <textarea
          className={styles.textarea}
          placeholder="What does success look like?"
          value={successCriteria}
          onChange={e => setSuccessCriteria(e.target.value)}
          rows={3}
        />
      </div>

      <div className={styles.actions}>
        <button className={styles.secondaryBtn} disabled={!isValid} onClick={() => onSaveToInbox(formData)}>
          Save to Inbox
        </button>
        <button className={styles.primaryBtn} disabled={!isValid} onClick={() => onAddToToday(formData)}>
          Add to Today
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7.4: Create components/popup/SaveForm.module.css**

```css
.form {
  width: 380px;
  padding: 16px;
  font-family: system-ui, -apple-system, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}

.pageInfo {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.favicon {
  width: 16px;
  height: 16px;
  margin-top: 4px;
  flex-shrink: 0;
}

.pageMeta {
  flex: 1;
  min-width: 0;
}

.titleInput {
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-bottom: 1px solid transparent;
  padding: 2px 0;
  outline: none;
  background: transparent;
  box-sizing: border-box;
}

.titleInput:focus {
  border-bottom-color: #6366f1;
}

.domain {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.url {
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.textarea {
  width: 100%;
  padding: 8px;
  font-size: 13px;
  font-family: inherit;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.textarea:focus {
  border-color: #6366f1;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.primaryBtn,
.secondaryBtn {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}

.primaryBtn {
  background: #6366f1;
  color: white;
  border: 1px solid transparent;
}

.secondaryBtn {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.primaryBtn:disabled,
.secondaryBtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

- [ ] **Step 7.5: Replace entrypoints/popup/App.tsx**

```typescript
import { useEffect, useState } from 'react';
import { TaskContextProvider, useTaskContext } from '../../context/TaskContext';
import { SaveForm } from '../../components/popup/SaveForm';
import type { Task } from '../../types/task';

interface PageMeta {
  title: string;
  url: string;
  domain: string;
  favicon?: string;
  description?: string;
  ogImage?: string;
}

function PopupContent() {
  const { addTask } = useTaskContext();
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
      const tab = tabs[0];
      if (!tab?.id || !tab.url) return;
      const domain = new URL(tab.url).hostname;
      let description: string | undefined;
      let ogImage: string | undefined;
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => ({
            description:
              document.querySelector('meta[name="description"]')?.getAttribute('content') ??
              document.querySelector('meta[property="og:description"]')?.getAttribute('content') ??
              undefined,
            ogImage:
              document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? undefined,
          }),
        });
        description = results[0]?.result?.description ?? undefined;
        ogImage = results[0]?.result?.ogImage ?? undefined;
      } catch {
        // Restricted pages (chrome://, etc.) — skip metadata extraction
      }
      setMeta({ title: tab.title ?? domain, url: tab.url, domain, favicon: tab.favIconUrl, description, ogImage });
    });
  }, []);

  const buildTaskData = (form: { title: string; why: string; successCriteria: string }) =>
    ({
      title: form.title,
      url: meta!.url,
      domain: meta!.domain,
      favicon: meta!.favicon,
      description: meta!.description,
      ogImage: meta!.ogImage,
      why: form.why,
      successCriteria: form.successCriteria,
    } as Omit<Task, 'id' | 'status' | 'activeSeconds' | 'createdAt' | 'updatedAt'>);

  const handleSaveToInbox = async (form: { title: string; why: string; successCriteria: string }) => {
    await addTask(buildTaskData(form));
    setSaved(true);
    setTimeout(() => window.close(), 600);
  };

  const handleAddToToday = async (form: { title: string; why: string; successCriteria: string }) => {
    await addTask(buildTaskData(form), true);
    setSaved(true);
    setTimeout(() => window.close(), 600);
  };

  if (saved) return <div style={{ padding: 16, fontFamily: 'system-ui' }}>Saved ✓</div>;
  if (!meta) return <div style={{ padding: 16, fontFamily: 'system-ui' }}>Loading…</div>;

  return (
    <SaveForm
      initialTitle={meta.title}
      url={meta.url}
      domain={meta.domain}
      favicon={meta.favicon}
      onSaveToInbox={handleSaveToInbox}
      onAddToToday={handleAddToToday}
    />
  );
}

export default function App() {
  return (
    <TaskContextProvider>
      <PopupContent />
    </TaskContextProvider>
  );
}
```

- [ ] **Step 7.6: Replace entrypoints/popup/main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7.7: Run tests — confirm they pass**

```bash
npm run test:run -- components/popup/SaveForm.test.tsx
```

Expected: PASS — 5 tests

- [ ] **Step 7.8: Commit**

```bash
git add components/popup/ entrypoints/popup/App.tsx entrypoints/popup/main.tsx
git commit -m "feat: add popup save form with intent capture"
```

---

## Task 8: TaskCard Component

**Files:**
- Create: `components/dashboard/TaskCard.tsx`
- Create: `components/dashboard/TaskCard.module.css`
- Create: `components/dashboard/TaskCard.test.tsx`

- [ ] **Step 8.1: Write the failing tests**

Create `components/dashboard/TaskCard.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from './TaskCard';
import type { Task } from '../../types/task';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Read the docs',
  url: 'https://example.com',
  domain: 'example.com',
  why: 'To understand the API',
  successCriteria: 'Can explain it',
  status: 'today',
  column: 'main',
  activeSeconds: 0,
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
});

const noop = vi.fn();
const defaultHandlers = { onStart: noop, onMarkDone: noop, onOpenAgain: noop, onEdit: noop, onDelete: noop };

describe('TaskCard', () => {
  it('renders the task title', () => {
    render(<TaskCard task={makeTask()} {...defaultHandlers} />);
    expect(screen.getByText('Read the docs')).toBeInTheDocument();
  });

  it('renders domain and status badge', () => {
    render(<TaskCard task={makeTask()} {...defaultHandlers} />);
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('today')).toBeInTheDocument();
  });

  it('shows Start button for today tasks on hover', async () => {
    render(<TaskCard task={makeTask({ status: 'today' })} {...defaultHandlers} />);
    await userEvent.hover(screen.getByText('Read the docs'));
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('calls onStart when Start clicked', async () => {
    const onStart = vi.fn();
    render(<TaskCard task={makeTask({ status: 'today' })} {...defaultHandlers} onStart={onStart} />);
    await userEvent.hover(screen.getByText('Read the docs'));
    await userEvent.click(screen.getByText('Start'));
    expect(onStart).toHaveBeenCalledWith(makeTask({ status: 'today' }));
  });

  it('shows Mark Done and Open Again for in_progress tasks', async () => {
    render(<TaskCard task={makeTask({ status: 'in_progress', trackedTabId: 5 })} {...defaultHandlers} />);
    await userEvent.hover(screen.getByText('Read the docs'));
    expect(screen.getByText('Mark Done')).toBeInTheDocument();
    expect(screen.getByText('Open Again')).toBeInTheDocument();
  });

  it('shows active time for in_progress tasks', () => {
    render(<TaskCard task={makeTask({ status: 'in_progress', activeSeconds: 125 })} {...defaultHandlers} />);
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('calls onMarkDone when Mark Done clicked', async () => {
    const onMarkDone = vi.fn();
    render(<TaskCard task={makeTask({ status: 'in_progress' })} {...defaultHandlers} onMarkDone={onMarkDone} />);
    await userEvent.hover(screen.getByText('Read the docs'));
    await userEvent.click(screen.getByText('Mark Done'));
    expect(onMarkDone).toHaveBeenCalledWith('task-1');
  });
});
```

- [ ] **Step 8.2: Run tests — confirm they fail**

```bash
npm run test:run -- components/dashboard/TaskCard.test.tsx
```

Expected: FAIL — `Cannot find module './TaskCard'`

- [ ] **Step 8.3: Implement components/dashboard/TaskCard.tsx**

```typescript
import { useState, useEffect } from 'react';
import type { Task } from '../../types/task';
import styles from './TaskCard.module.css';

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface TaskCardProps {
  task: Task;
  onStart: (task: Task) => void;
  onMarkDone: (taskId: string) => void;
  onOpenAgain: (task: Task) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onStart, onMarkDone, onOpenAgain, onEdit, onDelete }: TaskCardProps) {
  const [hovered, setHovered] = useState(false);
  const [localSeconds, setLocalSeconds] = useState(task.activeSeconds);

  useEffect(() => {
    setLocalSeconds(task.activeSeconds);
  }, [task.activeSeconds]);

  useEffect(() => {
    if (task.status !== 'in_progress') return;
    const id = setInterval(() => setLocalSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [task.status]);

  return (
    <div
      className={`${styles.card} ${styles[task.status]}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={styles.header}>
        <span className={styles.title}>{task.title}</span>
        <span className={styles.badge}>{task.status}</span>
      </div>

      <div className={styles.meta}>
        <span className={styles.domain}>{task.domain}</span>
        {task.status === 'in_progress' && (
          <span className={styles.timer}>{formatSeconds(localSeconds)}</span>
        )}
      </div>

      <div className={styles.intent}>
        <span className={styles.intentLine}>{task.why}</span>
        <span className={styles.intentLine}>{task.successCriteria}</span>
      </div>

      {hovered && (
        <div className={styles.actions}>
          {task.status === 'today' && (
            <button className={styles.primaryAction} onClick={() => onStart(task)}>Start</button>
          )}
          {task.status === 'in_progress' && (
            <>
              <button className={styles.primaryAction} onClick={() => onMarkDone(task.id)}>Mark Done</button>
              <button className={styles.secondaryAction} onClick={() => onOpenAgain(task)}>Open Again</button>
            </>
          )}
          {(task.status === 'today' || task.status === 'in_progress') && (
            <button className={styles.secondaryAction} onClick={() => onEdit(task.id)}>Edit</button>
          )}
          <button className={styles.dangerAction} onClick={() => onDelete(task.id)}>Delete</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8.4: Create components/dashboard/TaskCard.module.css**

```css
.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: default;
  position: relative;
  transition: box-shadow 0.1s;
}

.card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.in_progress {
  border-color: #6366f1;
  border-width: 2px;
}

.done {
  opacity: 0.45;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.title {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  line-height: 1.4;
}

.badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
  white-space: nowrap;
  flex-shrink: 0;
}

.in_progress .badge {
  background: #eef2ff;
  color: #6366f1;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.domain {
  font-size: 12px;
  color: #9ca3af;
}

.timer {
  font-size: 12px;
  color: #6366f1;
  font-variant-numeric: tabular-nums;
}

.intent {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.intentLine {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.primaryAction,
.secondaryAction,
.dangerAction {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}

.primaryAction {
  background: #6366f1;
  color: white;
  border: 1px solid transparent;
}

.secondaryAction {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.dangerAction {
  background: white;
  color: #ef4444;
  border: 1px solid #fecaca;
  margin-left: auto;
}
```

- [ ] **Step 8.5: Run tests — confirm they pass**

```bash
npm run test:run -- components/dashboard/TaskCard.test.tsx
```

Expected: PASS — 7 tests

- [ ] **Step 8.6: Commit**

```bash
git add components/dashboard/TaskCard.tsx components/dashboard/TaskCard.module.css components/dashboard/TaskCard.test.tsx
git commit -m "feat: add TaskCard component with status-based actions and live timer"
```

---

## Task 9: InboxSidebar + TimeBlocks

**Files:**
- Create: `components/dashboard/InboxSidebar.tsx`
- Create: `components/dashboard/InboxSidebar.module.css`
- Create: `components/dashboard/TimeBlocks.tsx`
- Create: `components/dashboard/TimeBlocks.module.css`

- [ ] **Step 9.1: Implement components/dashboard/InboxSidebar.tsx**

The sidebar renders inbox tasks as draggables and the inbox column as a droppable zone. `useDraggable` and `useDroppable` come from `@dnd-kit/core`.

```typescript
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types/task';
import styles from './InboxSidebar.module.css';

function DraggableInboxCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={styles.card}>
      <div className={styles.cardTitle}>{task.title}</div>
      <div className={styles.cardDomain}>{task.domain}</div>
    </div>
  );
}

interface InboxSidebarProps {
  tasks: Task[];
  isOpen: boolean;
}

export function InboxSidebar({ tasks, isOpen }: InboxSidebarProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'inbox' });
  const inboxTasks = tasks.filter(t => t.status === 'inbox');

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.header}>
        <span className={styles.title}>Inbox</span>
        <span className={styles.count}>{inboxTasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`${styles.dropZone} ${isOver ? styles.over : ''}`}
      >
        {inboxTasks.length === 0 ? (
          <div className={styles.empty}>No items in inbox</div>
        ) : (
          inboxTasks.map(task => <DraggableInboxCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 9.2: Create components/dashboard/InboxSidebar.module.css**

```css
.sidebar {
  width: 0;
  overflow: hidden;
  transition: width 0.2s ease;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.open {
  width: 240px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.count {
  font-size: 12px;
  background: #e5e7eb;
  color: #6b7280;
  border-radius: 10px;
  padding: 1px 7px;
}

.dropZone {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  min-height: 80px;
  border-radius: 4px;
  transition: background 0.1s;
}

.over {
  background: #eff6ff;
}

.empty {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  padding: 20px 0;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px;
  cursor: grab;
}

.card:active {
  cursor: grabbing;
}

.cardTitle {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cardDomain {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}
```

- [ ] **Step 9.3: Implement components/dashboard/TimeBlocks.tsx**

```typescript
import styles from './TimeBlocks.module.css';

const BLOCKS = ['Morning', 'Noon', 'Afternoon', 'Evening'] as const;

export function TimeBlocks() {
  return (
    <div className={styles.container}>
      {BLOCKS.map(block => (
        <div key={block} className={styles.block}>
          <span className={styles.label}>{block}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 9.4: Create components/dashboard/TimeBlocks.module.css**

```css
.container {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.block {
  flex: 1;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 8px 12px;
  text-align: center;
}

.label {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}
```

- [ ] **Step 9.5: Commit**

```bash
git add components/dashboard/InboxSidebar.tsx components/dashboard/InboxSidebar.module.css components/dashboard/TimeBlocks.tsx components/dashboard/TimeBlocks.module.css
git commit -m "feat: add InboxSidebar (droppable) and TimeBlocks (static placeholder)"
```

---

## Task 10: QuestColumn + QuestBoard

**Files:**
- Create: `components/dashboard/QuestColumn.tsx`
- Create: `components/dashboard/QuestColumn.module.css`
- Create: `components/dashboard/QuestBoard.tsx`
- Create: `components/dashboard/QuestBoard.module.css`

- [ ] **Step 10.1: Implement components/dashboard/QuestColumn.tsx**

```typescript
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Task, QuestColumn as QuestColumnType } from '../../types/task';
import { TaskCard } from './TaskCard';
import styles from './QuestColumn.module.css';

const COLUMN_LABELS: Record<QuestColumnType, string> = {
  boss: 'Boss',
  main: 'Main',
  side: 'Side',
};

interface DraggableCardProps {
  task: Task;
  onStart: (task: Task) => void;
  onMarkDone: (taskId: string) => void;
  onOpenAgain: (task: Task) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

function DraggableCard({ task, ...handlers }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard task={task} {...handlers} />
    </div>
  );
}

interface QuestColumnProps {
  column: QuestColumnType;
  tasks: Task[];
  onStart: (task: Task) => void;
  onMarkDone: (taskId: string) => void;
  onOpenAgain: (task: Task) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function QuestColumn({ column, tasks, ...handlers }: QuestColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column });
  const columnTasks = tasks.filter(t => (t.status === 'today' || t.status === 'in_progress') && t.column === column);

  return (
    <div className={`${styles.column} ${column === 'boss' ? styles.boss : ''}`}>
      <div className={styles.header}>
        <span className={styles.label}>{COLUMN_LABELS[column]}</span>
        <span className={styles.count}>{columnTasks.length}</span>
      </div>
      <div ref={setNodeRef} className={`${styles.dropZone} ${isOver ? styles.over : ''}`}>
        {columnTasks.length === 0 && (
          <div className={styles.empty}>Drop tasks here</div>
        )}
        {columnTasks.map(task => (
          <DraggableCard key={task.id} task={task} {...handlers} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 10.2: Create components/dashboard/QuestColumn.module.css**

```css
.column {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
  min-height: 200px;
}

.boss {
  border-color: #c7d2fe;
  background: #fafafe;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  border-bottom: 1px solid #e5e7eb;
}

.label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.boss .label {
  color: #6366f1;
}

.count {
  font-size: 12px;
  color: #9ca3af;
  background: #f3f4f6;
  border-radius: 10px;
  padding: 1px 6px;
}

.dropZone {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 80px;
  border-radius: 0 0 8px 8px;
  transition: background 0.1s;
}

.over {
  background: #eff6ff;
}

.empty {
  font-size: 12px;
  color: #d1d5db;
  text-align: center;
  padding: 24px 0;
  border: 1px dashed #e5e7eb;
  border-radius: 6px;
}
```

- [ ] **Step 10.3: Implement components/dashboard/QuestBoard.tsx**

```typescript
import type { Task, QuestColumn as QuestColumnType } from '../../types/task';
import { QuestColumn } from './QuestColumn';
import styles from './QuestBoard.module.css';

const COLUMNS: QuestColumnType[] = ['boss', 'main', 'side'];

interface QuestBoardProps {
  tasks: Task[];
  onStart: (task: Task) => void;
  onMarkDone: (taskId: string) => void;
  onOpenAgain: (task: Task) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function QuestBoard({ tasks, ...handlers }: QuestBoardProps) {
  return (
    <div className={styles.board}>
      {COLUMNS.map(col => (
        <QuestColumn key={col} column={col} tasks={tasks} {...handlers} />
      ))}
    </div>
  );
}
```

- [ ] **Step 10.4: Create components/dashboard/QuestBoard.module.css**

```css
.board {
  display: flex;
  gap: 12px;
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  align-items: flex-start;
}
```

- [ ] **Step 10.5: Commit**

```bash
git add components/dashboard/QuestColumn.tsx components/dashboard/QuestColumn.module.css components/dashboard/QuestBoard.tsx components/dashboard/QuestBoard.module.css
git commit -m "feat: add QuestColumn (droppable) and QuestBoard layout"
```

---

## Task 11: Dashboard Assembly (New Tab)

**Files:**
- Create: `components/dashboard/Header.tsx`
- Create: `components/dashboard/Header.module.css`
- Create: `entrypoints/newtab/index.html`
- Create: `entrypoints/newtab/main.tsx`
- Create: `entrypoints/newtab/App.tsx`

- [ ] **Step 11.1: Implement components/dashboard/Header.tsx**

```typescript
import styles from './Header.module.css';

interface HeaderProps {
  inboxOpen: boolean;
  onToggleInbox: () => void;
}

export function Header({ inboxOpen, onToggleInbox }: HeaderProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <button
          className={`${styles.inboxBtn} ${inboxOpen ? styles.active : ''}`}
          onClick={onToggleInbox}
          title="Toggle Inbox"
        >
          ☰ Inbox
        </button>
      </div>
      <div className={styles.center}>
        <span className={styles.chapter}>Today</span>
        <span className={styles.date}>{today}</span>
      </div>
      <div className={styles.right} />
    </div>
  );
}
```

- [ ] **Step 11.2: Create components/dashboard/Header.module.css**

```css
.header {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 52px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  flex-shrink: 0;
}

.left {
  flex: 1;
}

.center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.right {
  flex: 1;
}

.chapter {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.date {
  font-size: 11px;
  color: #9ca3af;
}

.inboxBtn {
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-family: inherit;
}

.inboxBtn.active {
  background: #eef2ff;
  border-color: #c7d2fe;
  color: #6366f1;
}
```

- [ ] **Step 11.3: Create entrypoints/newtab/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QuestTab</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: system-ui, -apple-system, sans-serif; background: white; }
      #root { height: 100vh; display: flex; flex-direction: column; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 11.4: Create entrypoints/newtab/main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 11.5: Create entrypoints/newtab/App.tsx**

This is where `DndContext` lives so it covers both the InboxSidebar (draggable source) and the QuestBoard columns (droppable targets), plus handles all drag-end routing.

```typescript
import { useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { TaskContextProvider, useTaskContext } from '../../context/TaskContext';
import { Header } from '../../components/dashboard/Header';
import { InboxSidebar } from '../../components/dashboard/InboxSidebar';
import { TimeBlocks } from '../../components/dashboard/TimeBlocks';
import { QuestBoard } from '../../components/dashboard/QuestBoard';
import type { Task, QuestColumn } from '../../types/task';
import styles from './App.module.css';

function Dashboard() {
  const { tasks, moveToToday, moveToInbox, moveColumn, startTask, markDone, deleteTask } = useTaskContext();
  const [inboxOpen, setInboxOpen] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const target = over.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (target === 'inbox') {
      moveToInbox(taskId);
    } else if (['boss', 'main', 'side'].includes(target)) {
      const col = target as QuestColumn;
      if (task.status === 'inbox') {
        moveToToday(taskId, col);
      } else {
        moveColumn(taskId, col);
      }
    }
  };

  const handleStart = async (task: Task) => {
    const tab = await chrome.tabs.create({ url: task.url });
    if (tab.id != null) await startTask(task.id, tab.id);
  };

  const handleOpenAgain = (task: Task) => {
    chrome.tabs.create({ url: task.url });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className={styles.layout}>
        <Header inboxOpen={inboxOpen} onToggleInbox={() => setInboxOpen(o => !o)} />
        <div className={styles.body}>
          <InboxSidebar tasks={tasks} isOpen={inboxOpen} />
          <div className={styles.main}>
            <TimeBlocks />
            <QuestBoard
              tasks={tasks}
              onStart={handleStart}
              onMarkDone={markDone}
              onOpenAgain={handleOpenAgain}
              onEdit={() => {}}
              onDelete={deleteTask}
            />
          </div>
        </div>
      </div>
    </DndContext>
  );
}

export default function App() {
  return (
    <TaskContextProvider>
      <Dashboard />
    </TaskContextProvider>
  );
}
```

- [ ] **Step 11.6: Create entrypoints/newtab/App.module.css**

```css
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
```

- [ ] **Step 11.7: Build the extension and verify no TypeScript errors**

```bash
npm run build
```

Expected: Build succeeds with output in `.output/`. Zero TypeScript errors. Any lint warnings are acceptable.

- [ ] **Step 11.8: Load the extension in Chrome and smoke-test**

1. Open `chrome://extensions`
2. Enable Developer Mode (top right toggle)
3. Click "Load unpacked" → select the `.output/chrome-mv3/` folder
4. Open a new tab — QuestTab Dashboard should appear
5. Click the extension icon on any page — the save popup should open
6. Fill in Why + Success Criteria, click "Save to Inbox"
7. Open a new tab, click the Inbox icon — the task should appear in the sidebar
8. Drag the task into the Main column
9. Click Start — a new tab opens with the target URL, the task shows In Progress
10. Return to the Dashboard tab — the timer should be counting
11. Click Mark Done — the task fades out

- [ ] **Step 11.9: Commit**

```bash
git add components/dashboard/Header.tsx components/dashboard/Header.module.css entrypoints/newtab/
git commit -m "feat: assemble dashboard — DndContext, Header, layout complete"
```

- [ ] **Step 11.10: Push to GitHub**

```bash
git push
```

---

## Task 12: Edit Task Modal (inline edit)

**Files:**
- Create: `components/dashboard/EditModal.tsx`
- Create: `components/dashboard/EditModal.module.css`
- Modify: `entrypoints/newtab/App.tsx`

The "Edit" button in TaskCard calls `onEdit(taskId)`. Task 11 passed `onEdit={() => {}}` as a stub. This task wires up a real inline edit modal.

- [ ] **Step 12.1: Implement components/dashboard/EditModal.tsx**

```typescript
import { useState } from 'react';
import type { Task } from '../../types/task';
import styles from './EditModal.module.css';

interface EditModalProps {
  task: Task;
  onSave: (patch: Partial<Pick<Task, 'title' | 'why' | 'successCriteria'>>) => void;
  onClose: () => void;
}

export function EditModal({ task, onSave, onClose }: EditModalProps) {
  const [title, setTitle] = useState(task.title);
  const [why, setWhy] = useState(task.why);
  const [successCriteria, setSuccessCriteria] = useState(task.successCriteria);

  const isValid = title.trim() && why.trim() && successCriteria.trim();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.heading}>Edit Task</h3>

        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input className={styles.input} value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Why learn / process this?</label>
          <textarea className={styles.textarea} value={why} onChange={e => setWhy(e.target.value)} rows={3} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Success criteria</label>
          <textarea className={styles.textarea} value={successCriteria} onChange={e => setSuccessCriteria(e.target.value)} rows={3} />
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            disabled={!isValid}
            onClick={() => { onSave({ title: title.trim(), why: why.trim(), successCriteria: successCriteria.trim() }); onClose(); }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 12.2: Create components/dashboard/EditModal.module.css**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: white;
  border-radius: 10px;
  padding: 24px;
  width: 440px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.heading {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.input,
.textarea {
  padding: 8px;
  font-size: 13px;
  font-family: inherit;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  outline: none;
}

.input:focus,
.textarea:focus {
  border-color: #6366f1;
}

.textarea {
  resize: vertical;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.saveBtn,
.cancelBtn {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}

.saveBtn {
  background: #6366f1;
  color: white;
  border: 1px solid transparent;
}

.saveBtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cancelBtn {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}
```

- [ ] **Step 12.3: Wire EditModal into entrypoints/newtab/App.tsx**

Replace the stub `onEdit={() => {}}` with real state. Add the following to the `Dashboard` component function body (before the return):

```typescript
const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
const editingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) : null;
```

Replace the `onEdit={() => {}}` prop in `<QuestBoard>` with:
```typescript
onEdit={setEditingTaskId}
```

Add the modal just before the closing `</DndContext>` tag:

```typescript
{editingTask && (
  <EditModal
    task={editingTask}
    onSave={patch => editTask(editingTask.id, patch)}
    onClose={() => setEditingTaskId(null)}
  />
)}
```

Also destructure `editTask` from `useTaskContext()` at the top of `Dashboard`.

- [ ] **Step 12.4: Build to confirm no errors**

```bash
npm run build
```

Expected: PASS with zero TypeScript errors.

- [ ] **Step 12.5: Run all tests**

```bash
npm run test:run
```

Expected: All tests pass.

- [ ] **Step 12.6: Commit and push**

```bash
git add components/dashboard/EditModal.tsx components/dashboard/EditModal.module.css entrypoints/newtab/App.tsx
git commit -m "feat: add edit modal for task title, why, and success criteria"
git push
```
