import { Link, useParams } from 'react-router-dom';
import styles from './OrderSuccess.module.scss';

const OrderSuccess = () => {
  const { id: orderId } = useParams(); // Get order ID from URL

  return (
    <div className={styles.successPage}>
      <div className={styles.icon}>✓</div>
      <h1 className={styles.title}>Order Placed!</h1>
      <p className={styles.message}>
        Thank you for your purchase. Your order is being processed.
      </p>
      <p className={styles.orderId}>
        Order ID: {orderId}
      </p>
      <Link to="/" className={styles.link}>
        Back to Shopping
      </Link>
    </div>
  );
};

export default OrderSuccess;