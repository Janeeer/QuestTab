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

async function wrap() {
  const result = render(<TaskContextProvider><Consumer /></TaskContextProvider>);
  // Flush the initial async getTasks() load from useEffect so it doesn't
  // overwrite state updates made by subsequent actions in the test.
  await act(async () => {});
  return result;
}

describe('TaskContext', () => {
  it('starts with no tasks', async () => {
    await wrap();
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('addTask creates an inbox task', async () => {
    await wrap();
    await act(async () => { screen.getByText('add').click(); });
    expect(screen.getByTestId('status').textContent).toBe('inbox');
    expect(screen.getByTestId('column').textContent).toBe('none');
  });

  it('addTask with toToday=true creates a today/main task', async () => {
    await wrap();
    await act(async () => { screen.getByText('addToday').click(); });
    expect(screen.getByTestId('status').textContent).toBe('today');
    expect(screen.getByTestId('column').textContent).toBe('main');
  });

  it('moveToToday sets status and column', async () => {
    await wrap();
    await act(async () => { screen.getByText('add').click(); });
    await act(async () => { screen.getByText('moveToday').click(); });
    expect(screen.getByTestId('status').textContent).toBe('today');
    expect(screen.getByTestId('column').textContent).toBe('boss');
  });

  it('moveColumn updates column only', async () => {
    await wrap();
    await act(async () => { screen.getByText('add').click(); });
    await act(async () => { screen.getByText('moveToday').click(); });
    await act(async () => { screen.getByText('moveCol').click(); });
    expect(screen.getByTestId('column').textContent).toBe('side');
  });

  it('moveToInbox clears column', async () => {
    await wrap();
    await act(async () => { screen.getByText('add').click(); });
    await act(async () => { screen.getByText('moveToday').click(); });
    await act(async () => { screen.getByText('moveInbox').click(); });
    expect(screen.getByTestId('status').textContent).toBe('inbox');
    expect(screen.getByTestId('column').textContent).toBe('none');
  });

  it('markDone sets status to done', async () => {
    await wrap();
    await act(async () => { screen.getByText('add').click(); });
    await act(async () => { screen.getByText('done').click(); });
    expect(screen.getByTestId('status').textContent).toBe('done');
  });

  it('deleteTask removes the task', async () => {
    await wrap();
    await act(async () => { screen.getByText('add').click(); });
    await act(async () => { screen.getByText('delete').click(); });
    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});
