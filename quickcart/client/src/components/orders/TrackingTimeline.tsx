import styles from './TrackingTimeline.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardCheck, 
  faBoxOpen, 
  faMotorcycle, 
  faCheckCircle 
} from '@fortawesome/free-solid-svg-icons';

interface TrackingTimelineProps {
  status: string;
}

const steps = [
  { id: 'CONFIRMED', label: 'Confirmed', icon: faClipboardCheck },
  { id: 'PACKING', label: 'Packing', icon: faBoxOpen },
  { id: 'OUT_FOR_DELIVERY', label: 'On the Way', icon: faMotorcycle },
  { id: 'DELIVERED', label: 'Delivered', icon: faCheckCircle },
];

const TrackingTimeline = ({ status }: TrackingTimelineProps) => {
  // Map status to a progress index (0 to 3)
  let currentIndex = steps.findIndex(s => s.id === status);
  
  // Handle edge cases
  if (status === 'PENDING') currentIndex = 0; 
  if (status === 'CANCELLED') return <div style={{color: 'red', fontWeight: 'bold', textAlign: 'center'}}>This order has been cancelled.</div>;

  // Calculate width for the green line
  const progressWidth = (currentIndex / (steps.length - 1)) * 100;

  return (
    <div className={styles.container}>
      {/* Grey Background Bar */}
      <div className={styles.progressBar}>
        {/* Green Fill Bar */}
        <div 
          className={styles.progressFill} 
          style={{ width: `${progressWidth}%` }}
        />
      </div>

      <div className={styles.steps}>
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          
          return (
            <div 
              key={step.id} 
              className={`${styles.step} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
            >
              <div className={styles.iconCircle}>
                <FontAwesomeIcon icon={step.icon} />
              </div>
              <span className={styles.label}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackingTimeline;