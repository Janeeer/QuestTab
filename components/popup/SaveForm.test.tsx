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
