import type { ReactNode } from 'react'; // <-- This is the fix for the error
import styles from './EmptyState.module.scss'; // Import SCSS module

interface EmptyStateProps {
  title: string;
  message: string;
  children?: ReactNode; // For a "call to action" button
}

const EmptyState = ({ title, message, children }: EmptyStateProps) => {
  return (
    <div className={styles.emptyState}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      <div className={styles.action}>{children}</div>
    </div>
  );
};

export default EmptyState;