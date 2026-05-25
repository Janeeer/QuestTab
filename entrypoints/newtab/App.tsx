import { useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { TaskContextProvider, useTaskContext } from '../../context/TaskContext';
import { Header } from '../../components/dashboard/Header';
import { InboxSidebar } from '../../components/dashboard/InboxSidebar';
import { TimeBlocks } from '../../components/dashboard/TimeBlocks';
import { QuestBoard } from '../../components/dashboard/QuestBoard';
import { EditModal } from '../../components/dashboard/EditModal';
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

export default function App() {
  return (
    <TaskContextProvider>
      <Dashboard />
    </TaskContextProvider>
  );
}
