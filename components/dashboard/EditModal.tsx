import { useState } from 'react';
import type { Task } from '../../types/task';
import styles from './EditModal.module.css';

interface EditModalProps {
  task: Task;
  onSave: (patch: Partial<Pick<Task, 'title' | 'why' | 'successCriteria'>>) => void;
  onClose: () => void;
}

export function EditModal({ task, onSave, onClose }: EditModalProps) {
  const [title, setTitle] = useState(task.title);
  const [why, setWhy] = useState(task.why);
  const [successCriteria, setSuccessCriteria] = useState(task.successCriteria);

  const isValid = title.trim() && why.trim() && successCriteria.trim();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.heading}>Edit Task</h3>

        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input className={styles.input} value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Why learn / process this?</label>
          <textarea className={styles.textarea} value={why} onChange={e => setWhy(e.target.value)} rows={3} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Success criteria</label>
          <textarea className={styles.textarea} value={successCriteria} onChange={e => setSuccessCriteria(e.target.value)} rows={3} />
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            disabled={!isValid}
            onClick={() => {
              onSave({ title: title.trim(), why: why.trim(), successCriteria: successCriteria.trim() });
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
