import type { Task, QuestColumn as QuestColumnType } from '../../types/task';
import { QuestColumn } from './QuestColumn';
import styles from './QuestBoard.module.css';

const COLUMNS: QuestColumnType[] = ['boss', 'main', 'side'];

interface QuestBoardProps {
  tasks: Task[];
  onMarkDone: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function QuestBoard({ tasks, ...handlers }: QuestBoardProps) {
  return (
    <div className={styles.board}>
      {COLUMNS.map(col => (
        <QuestColumn key={col} column={col} tasks={tasks} {...handlers} />
      ))}
    </div>
  );
}
