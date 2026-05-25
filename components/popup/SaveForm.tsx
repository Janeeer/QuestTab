import { useState } from 'react';
import styles from './SaveForm.module.css';

interface FormData {
  title: string;
  why: string;
  successCriteria: string;
}

interface SaveFormProps {
  initialTitle: string;
  url: string;
  domain: string;
  favicon?: string;
  onSaveToInbox: (data: FormData) => void;
  onAddToToday: (data: FormData) => void;
}

export function SaveForm({ initialTitle, url, domain, favicon, onSaveToInbox, onAddToToday }: SaveFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [why, setWhy] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');

  const isValid = why.trim().length > 0 && successCriteria.trim().length > 0;
  const formData: FormData = { title: title.trim(), why: why.trim(), successCriteria: successCriteria.trim() };

  return (
    <div className={styles.form}>
      <div className={styles.pageInfo}>
        {favicon && <img src={favicon} alt="" className={styles.favicon} />}
        <div className={styles.pageMeta}>
          <input className={styles.titleInput} value={title} onChange={e => setTitle(e.target.value)} />
          <div className={styles.domain}>{domain}</div>
          <div className={styles.url} title={url}>{url}</div>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Why learn / process this?</label>
        <textarea
          className={styles.textarea}
          placeholder="Why do you want to learn this?"
          value={why}
          onChange={e => setWhy(e.target.value)}
          rows={3}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Success criteria</label>
        <textarea
          className={styles.textarea}
          placeholder="What does success look like?"
          value={successCriteria}
          onChange={e => setSuccessCriteria(e.target.value)}
          rows={3}
        />
      </div>

      <div className={styles.actions}>
        <button className={styles.secondaryBtn} disabled={!isValid} onClick={() => onSaveToInbox(formData)}>
          Save to Inbox
        </button>
        <button className={styles.primaryBtn} disabled={!isValid} onClick={() => onAddToToday(formData)}>
          Add to Today
        </button>
      </div>
    </div>
  );
}
