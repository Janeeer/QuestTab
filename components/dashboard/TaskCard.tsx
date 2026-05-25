import { useState, useEffect } from 'react';
import type { Task } from '../../types/task';
import styles from './TaskCard.module.css';

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface TaskCardProps {
  task: Task;
  onStart: (task: Task) => void;
  onMarkDone: (taskId: string) => void;
  onOpenAgain: (task: Task) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onStart, onMarkDone, onOpenAgain, onEdit, onDelete }: TaskCardProps) {
  const [hovered, setHovered] = useState(false);
  const [localSeconds, setLocalSeconds] = useState(task.activeSeconds);

  useEffect(() => {
    setLocalSeconds(task.activeSeconds);
  }, [task.activeSeconds]);

  useEffect(() => {
    if (task.status !== 'in_progress') return;
    const id = setInterval(() => setLocalSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [task.status]);

  return (
    <div
      className={`${styles.card} ${styles[task.status]}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={styles.header}>
        <span className={styles.title}>{task.title}</span>
        <span className={styles.badge}>{task.status}</span>
      </div>

      <div className={styles.meta}>
        <span className={styles.domain}>{task.domain}</span>
        {task.status === 'in_progress' && (
          <span className={styles.timer}>{formatSeconds(localSeconds)}</span>
        )}
      </div>

      <div className={styles.intent}>
        <span className={styles.intentLine}>{task.why}</span>
        <span className={styles.intentLine}>{task.successCriteria}</span>
      </div>

      {hovered && (
        <div className={styles.actions}>
          {task.status === 'today' && (
            <button className={styles.primaryAction} onClick={() => onStart(task)}>Start</button>
          )}
          {task.status === 'in_progress' && (
            <>
              <button className={styles.primaryAction} onClick={() => onMarkDone(task.id)}>Mark Done</button>
              <button className={styles.secondaryAction} onClick={() => onOpenAgain(task)}>Open Again</button>
            </>
          )}
          {(task.status === 'today' || task.status === 'in_progress') && (
            <button className={styles.secondaryAction} onClick={() => onEdit(task.id)}>Edit</button>
          )}
          <button className={styles.dangerAction} onClick={() => onDelete(task.id)}>Delete</button>
        </div>
      )}
    </div>
  );
}
