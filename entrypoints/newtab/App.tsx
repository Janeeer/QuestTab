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
  const { tasks, moveToToday, moveToInbox, moveColumn, startTask, markDone, deleteTask, editTask } = useTaskContext();
  const [inboxOpen, setInboxOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const editingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) : null;

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
              onEdit={setEditingTaskId}
              onDelete={deleteTask}
            />
          </div>
        </div>
      </div>
      {editingTask && (
        <EditModal
          task={editingTask}
          onSave={patch => editTask(editingTask.id, patch)}
          onClose={() => setEditingTaskId(null)}
        />
      )}
    </DndContext>
  );
}

// Inline EditModal — moved here to avoid a circular import; full implementation in Task 12
function EditModal({ task, onSave, onClose }: {
  task: Task;
  onSave: (patch: Partial<Pick<Task, 'title' | 'why' | 'successCriteria'>>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [why, setWhy] = useState(task.why);
  const [successCriteria, setSuccessCriteria] = useState(task.successCriteria);
  const isValid = title.trim() && why.trim() && successCriteria.trim();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 10, padding: 24, width: 440, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Edit Task</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 500 }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={{ padding: 8, fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 500 }}>Why learn / process this?</label>
          <textarea value={why} onChange={e => setWhy(e.target.value)} rows={3} style={{ padding: 8, fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 500 }}>Success criteria</label>
          <textarea value={successCriteria} onChange={e => setSuccessCriteria(e.target.value)} rows={3} style={{ padding: 8, fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, borderRadius: 6, cursor: 'pointer', background: 'white', border: '1px solid #e5e7eb' }}>Cancel</button>
          <button disabled={!isValid} onClick={() => { onSave({ title: title.trim(), why: why.trim(), successCriteria: successCriteria.trim() }); onClose(); }} style={{ padding: '8px 16px', fontSize: 13, borderRadius: 6, cursor: 'pointer', background: '#6366f1', color: 'white', border: 'none', opacity: isValid ? 1 : 0.4 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TaskContextProvider>
      <Dashboard />
    </TaskContextProvider>
  );
}
