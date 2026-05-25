import { useDroppable } from '@dnd-kit/core';
import type { Task, TimeBlock, QuestColumn } from '../../types/task';
import styles from './TimeBlocks.module.css';

const BLOCKS: { id: TimeBlock; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'noon', label: 'Noon' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
];

const CHIP_COLOR: Record<QuestColumn, string> = {
  boss: styles.chipBoss,
  main: styles.chipMain,
  side: styles.chipSide,
};

interface ChipProps {
  task: Task;
  block: TimeBlock;
  onStart: (task: Task) => void;
  onOpenAgain: (task: Task) => void;
  onRemove: (taskId: string, block: TimeBlock) => void;
}

function TaskChip({ task, block, onStart, onOpenAgain, onRemove }: ChipProps) {
  const colorClass = task.column ? CHIP_COLOR[task.column] : '';
  return (
    <div className={`${styles.chip} ${colorClass}`}>
      <div className={styles.chipHeader}>
        <div className={styles.chipTitle}>
          {task.favicon
            ? <img src={task.favicon} className={styles.chipFavicon} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <span className={styles.chipFaviconFallback}>{task.domain[0].toUpperCase()}</span>
          }
          <span className={styles.chipTitleText}>{task.title}</span>
        </div>
        <button className={styles.chipRemove} onClick={() => onRemove(task.id, block)}>×</button>
      </div>
      <div className={styles.chipWhy} title={task.why}>{task.why}</div>
      <div className={styles.chipCriteria} title={task.successCriteria}>{task.successCriteria}</div>
      <div className={styles.chipActions}>
        {task.status === 'today' && (
          <button className={styles.chipStart} onClick={() => onStart(task)}>Start</button>
        )}
        {task.status === 'in_progress' && (
          <button className={styles.chipOpenAgain} onClick={() => onOpenAgain(task)}>Open Again</button>
        )}
        {task.status === 'done' && (
          <span className={styles.chipDoneLabel}>Done</span>
        )}
      </div>
    </div>
  );
}

interface TimeBlockRowProps {
  block: typeof BLOCKS[0];
  tasks: Task[];
  onStart: (task: Task) => void;
  onOpenAgain: (task: Task) => void;
  onRemove: (taskId: string, block: TimeBlock) => void;
}

function TimeBlockRow({ block, tasks, onStart, onOpenAgain, onRemove }: TimeBlockRowProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `timeblock-${block.id}` });
  return (
    <div className={`${styles.row} ${isOver ? styles.over : ''}`}>
      <div className={styles.rowLabel}>{block.label}</div>
      <div ref={setNodeRef} className={styles.rowSlots}>
        {tasks.length === 0 && (
          <div className={styles.rowEmpty}>Drop a quest here</div>
        )}
        {tasks.map(task => (
          <TaskChip
            key={`${task.id}-${block.id}`}
            task={task}
            block={block.id}
            onStart={onStart}
            onOpenAgain={onOpenAgain}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}

interface TimeBlocksProps {
  tasks: Task[];
  onStart: (task: Task) => void;
  onOpenAgain: (task: Task) => void;
  onRemove: (taskId: string, block: TimeBlock) => void;
}

export function TimeBlocks({ tasks, onStart, onOpenAgain, onRemove }: TimeBlocksProps) {
  return (
    <div className={styles.container}>
      {BLOCKS.map(block => (
        <TimeBlockRow
          key={block.id}
          block={block}
          tasks={tasks.filter(t => t.timeBlocks.includes(block.id))}
          onStart={onStart}
          onOpenAgain={onOpenAgain}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
