# QuestTab — Design Spec
_Date: 2026-05-25_

## Overview

QuestTab is a Chrome Extension (Manifest V3) that turns web pages into focused, trackable daily learning tasks. Users capture pages with intent (why + success criteria), plan them into Boss / Main / Side quest columns, launch directly from the dashboard, and track active reading time — all without ever touching a platform homepage or recommendation feed.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Extension framework | WXT |
| Language | TypeScript |
| UI | React |
| Styling | Plain CSS / CSS Modules |
| Storage | `chrome.storage.local` |
| Manifest | V3 |
| Drag-and-drop | @dnd-kit/core |
| Dashboard entry | New Tab Override |

---

## Project Structure

```
QuestTab/
├── wxt.config.ts
├── package.json
├── tsconfig.json
├── public/
│   └── icons/
├── entrypoints/
│   ├── background.ts          # service worker: tab tracking
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx            # save-page form
│   └── newtab/
│       ├── index.html
│       ├── main.tsx
│       └── App.tsx            # Dashboard shell
├── components/
│   ├── popup/
│   │   └── SaveForm.tsx
│   └── dashboard/
│       ├── Header.tsx
│       ├── InboxSidebar.tsx
│       ├── TimeBlocks.tsx
│       ├── QuestBoard.tsx
│       ├── QuestColumn.tsx
│       └── TaskCard.tsx
├── context/
│   └── TaskContext.tsx
├── types/
│   └── task.ts
└── utils/
    └── storage.ts
```

---

## Data Model

```typescript
// types/task.ts

export type TaskStatus = 'inbox' | 'today' | 'in_progress' | 'done';
export type QuestColumn = 'boss' | 'main' | 'side';

export interface Task {
  id: string;                  // crypto.randomUUID()
  title: string;
  url: string;
  domain: string;
  description?: string;
  favicon?: string;
  ogImage?: string;

  why: string;                 // required at save time
  successCriteria: string;     // required at save time

  status: TaskStatus;
  column?: QuestColumn;        // undefined when status is 'inbox'

  activeSeconds: number;       // cumulative active tab time
  trackedTabId?: number;       // set by background on Start, cleared on Done

  createdAt: number;           // Date.now()
  updatedAt: number;
}

export interface StorageSchema {
  tasks: Task[];
}
```

**Key rules:**
- `column` is only set when `status` is `'today'` or `'in_progress'`
- Dragging from Inbox → Today defaults `column` to `'main'`
- `activeSeconds` is written by the background service worker directly into storage
- `trackedTabId` is cleared when task moves to `'done'`

---

## State Management

Architecture: **React Context + chrome.storage sync**

```typescript
interface TaskContextValue {
  tasks: Task[];
  addTask:    (task: Omit<Task, 'id' | 'status' | 'activeSeconds' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  moveToToday: (taskId: string, column?: QuestColumn) => Promise<void>;
  moveToInbox: (taskId: string) => Promise<void>;
  moveColumn:  (taskId: string, column: QuestColumn) => Promise<void>;
  startTask:   (taskId: string, tabId: number) => Promise<void>;
  markDone:    (taskId: string) => Promise<void>;
  editTask:    (taskId: string, patch: Partial<Pick<Task, 'title' | 'why' | 'successCriteria'>>) => Promise<void>;
  deleteTask:  (taskId: string) => Promise<void>;
}
```

**Initialization flow:**
1. `TaskContextProvider` mounts → reads all tasks from `chrome.storage.local`
2. Registers `chrome.storage.onChanged` listener — background's `activeSeconds` / `trackedTabId` updates merge into local state
3. Every action updates local state immediately (optimistic) and writes to storage async

**Popup vs Dashboard:** Both entrypoints wrap their React tree in `TaskContextProvider`. They don't share a React tree — storage is the shared layer.

---

## Extension Pages

### Popup (Save Form)

- On mount: `chrome.tabs.query({active: true, currentWindow: true})` to get URL, title, favicon
- `scripting.executeScript` to extract `meta description`, `og:title`, `og:image` from the page
- Fields: Title (pre-filled, editable), Domain (read-only), Why (required), Success Criteria (required)
- Buttons: **Save to Inbox** (`status: 'inbox'`) | **Add to Today** (`status: 'today', column: 'main'`)
- Fixed width ~380px, closes after save

### Background Service Worker

Handles active time tracking via three Chrome events:

| Event | Action |
|---|---|
| `chrome.tabs.onActivated` | Start/stop ticking based on whether new active tab matches a `trackedTabId` |
| `chrome.tabs.onUpdated` | Stop ticking if tracked tab navigates away |
| `chrome.windows.onFocusChanged` | Pause all ticking on window blur, resume on focus |

**Tracking logic:**
- In-memory `Map<taskId, startTimestamp>` for currently-ticking tasks
- On leave tracked tab: compute elapsed seconds, add to `task.activeSeconds` in storage
- On enter tracked tab: record `startTimestamp`
- On `markDone`: clear `trackedTabId`, stop ticking that task
- No message passing — background reads/writes `chrome.storage.local` directly

---

## Dashboard Component Architecture

```
newtab/App.tsx
└── TaskContextProvider
    └── Dashboard
        ├── Header
        │   ├── "Today" title + date
        │   └── InboxIcon (click → toggles sidebar)
        ├── DndContext (@dnd-kit)
        │   ├── InboxSidebar (collapsible, left)
        │   │   └── TaskCard[] (draggable)
        │   ├── TimeBlocks (placeholder, top)
        │   │   └── Morning / Noon / Afternoon / Evening (static)
        │   └── QuestBoard (bottom)
        │       ├── QuestColumn: Boss (droppable)
        │       ├── QuestColumn: Main (droppable)
        │       └── QuestColumn: Side (droppable)
        │           └── TaskCard[] (draggable)
        └── TaskCard (hover → shows Start / Mark Done / Edit / Delete)
```

**Drag-and-drop rules:**
- Inbox → QuestColumn: `moveToToday(id, targetColumn)`
- QuestColumn → QuestColumn: `moveColumn(id, targetColumn)`
- QuestColumn → Inbox: `moveToInbox(id)`

**TaskCard visual states:**

| Status | Appearance |
|---|---|
| `inbox` | Neutral |
| `today` | Default card |
| `in_progress` | Highlighted border, live active time counter, Mark Done / Open Again buttons |
| `done` | Dimmed / faded |

**Active time counter:** `in_progress` cards tick client-side every second via `setInterval`, adding local elapsed seconds to `activeSeconds` from context — avoids polling storage on every tick.

---

## Error Handling

- Popup metadata extraction failure → fields left empty, user fills manually (spec intent)
- Storage write failure → log to console, no UI error (local-only, extremely rare)
- Tab closed before Mark Done → background stops ticking, `activeSeconds` preserved, task stays `in_progress`

---

## Non-Goals (MVP)

Per spec: no AI summary, no RSS, no knowledge base, no cloud sync, no account, no per-site deep extraction, no Time Blocker drag, no Partial/Skipped states, no task count limits.
