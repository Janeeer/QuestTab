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
