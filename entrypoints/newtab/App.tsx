import { useState } from 'react';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { TaskContextProvider, useTaskContext } from '../../context/TaskContext';
import { Header } from '../../components/dashboard/Header';
import { InboxSidebar } from '../../components/dashboard/InboxSidebar';
import { TimeBlocks } from '../../components/dashboard/TimeBlocks';
import { QuestBoard } from '../../components/dashboard/QuestBoard';
import { EditModal } from '../../components/dashboard/EditModal';
import type { Task, QuestColumn, TimeBlock } from '../../types/task';
import styles from './App.module.css';

interface DupConfirm {
  existing: Task;
  onConfirm: () => void;
}

function Dashboard() {
  const { tasks, moveToToday, moveToInbox, moveColumn, startTask, setTrackedTab, markDone, deleteTask, editTask, assignTimeBlock, removeTimeBlock } = useTaskContext();
  const [inboxOpen, setInboxOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dupConfirm, setDupConfirm] = useState<DupConfirm | null>(null);
  const editingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) : null;
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  const withDupCheck = (taskId: string, action: () => void) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return action();
    const existing = tasks.find(t => t.id !== taskId && t.url === task.url);
    if (existing) {
      setDupConfirm({ existing, onConfirm: action });
    } else {
      action();
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const target = over.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (target === 'inbox') {
      withDupCheck(taskId, () => moveToInbox(taskId));
    } else if (['boss', 'main', 'side'].includes(target)) {
      const col = target as QuestColumn;
      if (task.status === 'inbox') {
        withDupCheck(taskId, () => moveToToday(taskId, col));
      } else {
        moveColumn(taskId, col);
      }
    } else if (target.startsWith('timeblock-')) {
      const block = target.replace('timeblock-', '') as TimeBlock;
      if (task.status === 'inbox') {
        withDupCheck(taskId, async () => {
          await moveToToday(taskId, 'main');
          assignTimeBlock(taskId, block);
        });
      } else {
        assignTimeBlock(taskId, block);
      }
    }
  };

  const handleStart = async (task: Task) => {
    await startTask(task.id);                              // in_progress 先写入 storage
    const tab = await chrome.tabs.create({ url: task.url }); // 再开 tab，onActivated 触发时已是 in_progress
    if (tab.id != null) await setTrackedTab(task.id, tab.id);
  };

  const handleOpenAgain = async (task: Task) => {
    const tab = await chrome.tabs.create({ url: task.url });
    if (tab.id != null) await setTrackedTab(task.id, tab.id);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={styles.layout}>
        <Header inboxOpen={inboxOpen} onToggleInbox={() => setInboxOpen(o => !o)} />
        <div className={styles.body}>
          <InboxSidebar tasks={tasks} isOpen={inboxOpen} />
          <div className={styles.main}>
            <TimeBlocks
              tasks={tasks}
              onStart={handleStart}
              onOpenAgain={handleOpenAgain}
              onRemove={removeTimeBlock}
            />
            <QuestBoard
              tasks={tasks}
              onMarkDone={markDone}
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
      {dupConfirm && (
        <div className={styles.dupOverlay}>
          <div className={styles.dupModal}>
            <div className={styles.dupTitle}>重复关卡</div>
            <div className={styles.dupBody}>相同 URL 已存在：</div>
            <div className={styles.dupExisting}>{dupConfirm.existing.title}</div>
            <div className={styles.dupActions}>
              <button className={styles.dupCancel} onClick={() => setDupConfirm(null)}>取消</button>
              <button className={styles.dupConfirm} onClick={() => { dupConfirm.onConfirm(); setDupConfirm(null); }}>仍然移动</button>
            </div>
          </div>
        </div>
      )}
      <DragOverlay>
        {activeTask && (
          <div className={styles.dragPreview}>
            <div className={styles.dragPreviewTitle}>{activeTask.title}</div>
            <div className={styles.dragPreviewDomain}>{activeTask.domain}</div>
          </div>
        )}
      </DragOverlay>
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
