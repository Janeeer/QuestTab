import styles from './Header.module.css';

interface HeaderProps {
  inboxOpen: boolean;
  onToggleInbox: () => void;
}

export function Header({ inboxOpen, onToggleInbox }: HeaderProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <button
          className={`${styles.inboxBtn} ${inboxOpen ? styles.active : ''}`}
          onClick={onToggleInbox}
          title="Toggle Inbox"
        >
          ☰ Inbox
        </button>
      </div>
      <div className={styles.center}>
        <span className={styles.chapter}>Today</span>
        <span className={styles.date}>{today}</span>
      </div>
      <div className={styles.right} />
    </div>
  );
}
