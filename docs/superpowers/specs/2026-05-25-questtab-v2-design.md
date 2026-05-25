# QuestTab — Design Spec v2
_Date: 2026-05-25 (last updated: dedup, comet border, last-timed dot)_

## Overview

QuestTab is a Chrome Extension (Manifest V3) that turns web pages into focused, trackable daily learning quests. Users capture pages with intent (why + success criteria), plan them into a timetable (TimeBlocks) and quest columns (Boss / Main / Side), launch directly from the dashboard, and track active reading time automatically.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Extension framework | WXT |
| Language | TypeScript |
| UI | React 18 |
| Styling | CSS Modules |
| Storage | `chrome.storage.local` |
| Manifest | V3 |
| Drag-and-drop | @dnd-kit/core |
| Dashboard entry | New Tab Override |

---

## Project Structure

```
QuestTab/
├── entrypoints/
│   ├── background.ts          # service worker: tab + time tracking
│   ├── popup/App.tsx          # save-page form
│   └── newtab/App.tsx         # Dashboard shell
├── components/dashboard/
│   ├── Header.tsx
│   ├── InboxSidebar.tsx
│   ├── TimeBlocks.tsx         # timetable (core, top section)
│   ├── QuestBoard.tsx         # three columns (secondary, bottom)
│   ├── QuestColumn.tsx
│   ├── TaskCard.tsx
│   └── EditModal.tsx
├── context/TaskContext.tsx
├── types/task.ts
└── utils/
    ├── storage.ts
    └── tracker.ts             # ActiveTimeTracker (in-memory Map)
```

---

## Data Model

```typescript
export type TaskStatus = 'inbox' | 'today' | 'in_progress' | 'done';
export type QuestColumn = 'boss' | 'main' | 'side';
export type TimeBlock = 'morning' | 'noon' | 'afternoon' | 'evening';

export interface Task {
  id: string;
  title: string;
  url: string;
  domain: string;
  favicon?: string;

  why: string;
  successCriteria: string;

  status: TaskStatus;
  column?: QuestColumn;        // set when status is 'today' | 'in_progress' | 'done'
  timeBlocks: TimeBlock[];     // a task may appear in multiple time slots

  activeSeconds: number;       // cumulative active tab time (written by background)
  trackedTabId?: number;       // set after Start, cleared on Done

  createdAt: number;
  updatedAt: number;
}
```

**Key rules:**
- `timeBlocks` is an array — the same task can appear in multiple time slots (e.g., morning AND afternoon)
- `column` persists through `in_progress` and `done` so cards stay visible in their column
- `trackedTabId` is used as a fallback; primary tab matching is by URL (see Background section)
- Old stored tasks missing `timeBlocks` are backfilled via `migrate()` on load

---

## State Management

Architecture: **React Context + chrome.storage as single source of truth**

```typescript
interface TaskContextValue {
  tasks: Task[];
  lastTimedId: string | null;    // ID of task whose activeSeconds most recently increased
  addTask: (data, toToday?) => Promise<void>;
  moveToToday: (taskId, column?) => Promise<void>;
  moveToInbox: (taskId) => Promise<void>;
  moveColumn: (taskId, column) => Promise<void>;
  startTask: (taskId) => Promise<void>;        // only sets status → in_progress
  setTrackedTab: (taskId, tabId) => Promise<void>; // only sets trackedTabId
  markDone: (taskId) => Promise<void>;
  editTask: (taskId, patch) => Promise<void>;
  assignTimeBlock: (taskId, block) => Promise<void>;
  removeTimeBlock: (taskId, block) => Promise<void>;
  deleteTask: (taskId) => Promise<void>;
}
```

**Stale closure fix:** `tasksRef = useRef<Task[]>([])` mirrors state. `persist()` reads from `tasksRef.current` (not the closure-captured `tasks`) so sequential calls don't overwrite each other.

**Storage sync:** `chrome.storage.onChanged` listener keeps the dashboard in sync with background's `activeSeconds` writes. The listener also detects which task's `activeSeconds` just increased and sets `lastTimedId` — used to show a purple dot on that card.

---

## Dashboard Layout

```
┌─────────────────────────────────────┐
│  Header (title + inbox toggle)      │
├──────┬──────────────────────────────┤
│Inbox │  TimeBlocks (timetable)      │  ← primary section
│Side- │  Morning / Noon / Afternoon  │
│ bar  │  Evening                     │
│      ├──────────────────────────────┤
│      │  QuestBoard                  │  ← secondary section
│      │  Boss | Main | Side          │
└──────┴──────────────────────────────┘
```

**TimeBlocks (timetable):**
- Light yellow background (`#fefce8`)
- 4 rows (morning / noon / afternoon / evening), each fixed height (130px)
- Each row is a droppable zone — dragging any task (inbox or column) onto a row assigns that TimeBlock
- Tasks in the same row rendered as horizontal-scrolling chips (no wrapping)
- Chip shows: favicon, title, 💡 why (1 line), 🎯 success criteria (1 line), Start / Open Again / Done label
- why/criteria truncated to 1 line; hover `title` attribute shows full text

**QuestBoard:**
- Three equal-width columns (`flex: 1; min-width: 0`), responsive to window width
- Shows tasks with status `today | in_progress | done`
- Done tasks stay visible (dimmed at 45% opacity)
- Cards show: favicon, title, active time as `xxmin` (integer minutes, `Math.ceil`)
- Purple dot shown to the right of `xxmin` on the card whose `activeSeconds` most recently increased (`lastTimedId`)

---

## Drag-and-Drop Rules

| From | To | Action |
|---|---|---|
| Inbox | QuestColumn | `moveToToday(id, column)` |
| Inbox | TimeBlock row | `moveToToday(id, 'main')` then `assignTimeBlock(id, block)` |
| QuestColumn | QuestColumn | `moveColumn(id, column)` |
| QuestColumn | Inbox | `moveToInbox(id)` |
| QuestColumn | TimeBlock row | `assignTimeBlock(id, block)` |
| Any | TimeBlock row | if already `today`, just `assignTimeBlock` |

Uses `MouseSensor` with `activationConstraint: { distance: 5 }` so button clicks are not swallowed by dnd-kit.

**Duplicate URL check on drag:** When moving a task between inbox and today (or to a TimeBlock from inbox), check if another task with the same URL already exists. If so, show a confirmation modal before proceeding.

---

## Starting a Quest (Time Tracking Race-Condition Fix)

```
1. startTask(taskId)          → writes status: 'in_progress' to storage  FIRST
2. chrome.tabs.create(url)    → tab opens → onActivated fires in background
   background reads storage → task is already in_progress → startTick(taskId)
3. setTrackedTab(taskId, tabId) → writes trackedTabId to storage
```

This order guarantees `onActivated` always sees `in_progress` when it fires.

---

## Background Service Worker

**ActiveTimeTracker** (`utils/tracker.ts`): in-memory `Map<taskId, startTimestamp>`.

**Tab matching strategy (primary: URL, fallback: tabId):**
```typescript
async function syncActiveTab(tabId: number) {
  const [activeTab, inProgress] = await Promise.all([
    chrome.tabs.get(tabId).catch(() => null),
    getInProgress(),
  ]);
  for (const task of inProgress) {
    const matches =
      (activeTab?.url && task.url === activeTab.url) ||
      task.trackedTabId === tabId;
    if (matches && windowFocused) tracker.startTick(task.id);
    else if (tracker.isTracking(task.id)) await stopAndSave(task.id);
  }
}
```

URL matching is primary because `trackedTabId` is written after `tabs.create` returns, which is after `onActivated` fires.

**Events handled:**
| Event | Action |
|---|---|
| `tabs.onActivated` | `syncActiveTab(tabId)` |
| `tabs.onRemoved` | `stopAndSave` for any task with matching `trackedTabId` |
| `windows.onFocusChanged` | blur → `stopAll()`; focus → `syncActiveTab` |
| `setInterval(10s)` | flush accumulated seconds to storage, restart tracking |

---

## Popup — URL Deduplication

When the popup opens on a page already saved (status ≠ `done`):
- Both "Save to Inbox" and "Add to Today" buttons are **disabled**
- A label appears on the left of the button row: `已在 Inbox` or `已在 Today`
- `done` tasks are excluded — the user may want to revisit a completed page

---

## EditModal

Fields: URL (read-only, with favicon + clickable link), Title, Why, Success Criteria.

---

## TaskCard Visual States

| Status | Appearance |
|---|---|
| `inbox` | Neutral, 1px gray border |
| `today` | Default card |
| `in_progress` | 2px solid colored border (red/blue/green by column) + CSS comet animation |
| `done` | 45% opacity |

**Comet border animation** (`in_progress` only):
- `.borderGlow`: `position: absolute; inset: -2px; padding: 4px; overflow: hidden`
- CSS mask (`content-box XOR padding-box`) clips children to the 4px padding ring
- `overflow: hidden` prevents the rotating comet from causing layout shifts in the flex column
- `.glowDot` inside: `width: 80px; height: 3px`, `linear-gradient(to right, transparent, white)`
- `offset-path: inset(2px 2px 2px 2px round 6px)` centers the path on the padding ring
- `offset-rotate: auto` + `will-change: offset-distance` + `transform: translateZ(0)` → GPU composited, comet head always leads
- Animation: 4s linear infinite

---

## Non-Goals (MVP)

No AI summary, no cloud sync, no account, no per-site deep extraction, no Partial/Skipped states, no task count limits, no notifications, no recurring tasks.
