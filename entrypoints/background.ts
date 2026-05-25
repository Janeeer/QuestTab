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
