import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Task, QuestColumn as QuestColumnType } from '../../types/task';
import { TaskCard } from './TaskCard';
import styles from './QuestColumn.module.css';

const COLUMN_LABELS: Record<QuestColumnType, string> = {
  boss: 'Boss',
  main: 'Main',
  side: 'Side',
};

interface DraggableCardProps {
  task: Task;
  onMarkDone: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

function DraggableCard({ task, ...handlers }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard task={task} {...handlers} />
    </div>
  );
}

interface QuestColumnProps {
  column: QuestColumnType;
  tasks: Task[];
  onMarkDone: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function QuestColumn({ column, tasks, ...handlers }: QuestColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column });
  const columnTasks = tasks.filter(
    t => (t.status === 'today' || t.status === 'in_progress' || t.status === 'done') && t.column === column
  );

  return (
    <div className={`${styles.column} ${styles[column]}`}>
      <div className={styles.header}>
        <span className={styles.label}>{COLUMN_LABELS[column]}</span>
        <span className={styles.count}>{columnTasks.length}</span>
      </div>
      <div ref={setNodeRef} className={`${styles.dropZone} ${isOver ? styles.over : ''}`}>
        {columnTasks.length === 0 && (
          <div className={styles.empty}>Drop tasks here</div>
        )}
        {columnTasks.map(task => (
          <DraggableCard key={task.id} task={task} {...handlers} />
        ))}
      </div>
    </div>
  );
}
