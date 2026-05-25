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
