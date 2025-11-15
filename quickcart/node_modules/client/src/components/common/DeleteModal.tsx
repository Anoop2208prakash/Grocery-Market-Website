import styles from './DeleteModal.module.scss';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DeleteModal = ({ isOpen, onClose, onConfirm, title, message }: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>{title || 'Confirm Delete'}</h3>
        <p>{message || 'Are you sure you want to delete this item? This action cannot be undone.'}</p>
        <div className={styles.actions}>
          <button className={`${styles.button} ${styles.cancelBtn}`} onClick={onClose}>
            Cancel
          </button>
          <button className={`${styles.button} ${styles.deleteBtn}`} onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;