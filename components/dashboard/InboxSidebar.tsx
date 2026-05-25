import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types/task';
import styles from './InboxSidebar.module.css';

function DraggableInboxCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={styles.card}>
      <div className={styles.cardTitle}>{task.title}</div>
      <div className={styles.cardDomain}>{task.domain}</div>
    </div>
  );
}

interface InboxSidebarProps {
  tasks: Task[];
  isOpen: boolean;
}

export function InboxSidebar({ tasks, isOpen }: InboxSidebarProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'inbox' });
  const inboxTasks = tasks.filter(t => t.status === 'inbox');

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.header}>
        <span className={styles.title}>Inbox</span>
        <span className={styles.count}>{inboxTasks.length}</span>
      </div>
      <div ref={setNodeRef} className={`${styles.dropZone} ${isOver ? styles.over : ''}`}>
        {inboxTasks.length === 0 ? (
          <div className={styles.empty}>No items in inbox</div>
        ) : (
          inboxTasks.map(task => <DraggableInboxCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
