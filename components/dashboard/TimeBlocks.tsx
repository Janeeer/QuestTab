import styles from './TimeBlocks.module.css';

const BLOCKS = ['Morning', 'Noon', 'Afternoon', 'Evening'] as const;

export function TimeBlocks() {
  return (
    <div className={styles.container}>
      {BLOCKS.map(block => (
        <div key={block} className={styles.block}>
          <span className={styles.label}>{block}</span>
        </div>
      ))}
    </div>
  );
}
