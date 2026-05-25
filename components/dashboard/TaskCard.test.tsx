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
