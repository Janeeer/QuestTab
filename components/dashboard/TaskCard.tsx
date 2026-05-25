import { useState } from 'react';
import type { Task } from '../../types/task';
import styles from './TaskCard.module.css';

function formatSeconds(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface TaskCardProps {
  task: Task;
  onMarkDone: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onMarkDone, onEdit, onDelete }: TaskCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`${styles.card} ${styles[task.status]}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={styles.main}>
        {task.favicon
          ? <img src={task.favicon} className={styles.favicon} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          : <span className={styles.faviconFallback}>{task.domain[0].toUpperCase()}</span>
        }
        <span className={styles.title}>{task.title}</span>
        {task.activeSeconds > 0 && (
          <span className={styles.timer}>{formatSeconds(task.activeSeconds)}</span>
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
