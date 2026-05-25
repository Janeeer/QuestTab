import { useState } from 'react';
import type { Task } from '../../types/task';
import { useTaskContext } from '../../context/TaskContext';
import styles from './TaskCard.module.css';

function formatDuration(total: number): string {
  return `${Math.ceil(total / 60)}min`;
}

interface TaskCardProps {
  task: Task;
  onMarkDone: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onMarkDone, onEdit, onDelete }: TaskCardProps) {
  const [hovered, setHovered] = useState(false);
  const { lastTimedId } = useTaskContext();
  const columnClass = task.status === 'in_progress' && task.column
    ? styles[`in_progress_${task.column}`]
    : '';

  return (
    <div
      className={`${styles.card} ${styles[task.status]} ${columnClass}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {task.status === 'in_progress' && (
        <span className={styles.borderGlow} aria-hidden="true">
          <span className={styles.glowDot} />
        </span>
      )}
      <div className={styles.main}>
        {task.favicon
          ? <img src={task.favicon} className={styles.favicon} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          : <span className={styles.faviconFallback}>{task.domain[0].toUpperCase()}</span>
        }
        <span className={styles.title}>{task.title}</span>
        {task.activeSeconds > 0 && (
          <span className={styles.timerWrapper}>
            <span className={styles.timer}>{formatDuration(task.activeSeconds)}</span>
            {lastTimedId === task.id && <span className={styles.activeDot} />}
          </span>
        )}
      </div>

      {hovered && (
        <div className={styles.actions}>
          {task.status === 'in_progress' && (
            <button className={styles.primaryAction} onClick={() => onMarkDone(task.id)}>Done</button>
          )}
          <button className={styles.secondaryAction} onClick={() => onEdit(task.id)}>Edit</button>
          <button className={styles.dangerAction} onClick={() => onDelete(task.id)}>Delete</button>
        </div>
      )}
    </div>
  );
}
