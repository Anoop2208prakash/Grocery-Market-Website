import type { ReactNode } from 'react'; // <-- THIS IS THE FIX
import styles from './Modal.module.scss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

// Close (X) Icon
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  // Stop clicks inside the modal from closing it
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={handleModalClick}>
        <button className={styles.closeButton} onClick={onClose}>
          <CloseIcon />
        </button>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;