import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { Link } from 'react-router-dom';
import styles from './Orders.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

// 1. Define the shape of the API response
interface OrderResponse {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
  items: { id: string }[]; // We need this to count items
}

// 2. Define the shape for the UI
interface OrderRow {
  id: string;
  customer: string;
  total: string;
  status: string;
  date: string;
  itemsCount: number;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // 3. Use the correct type here
        const { data } = await apiClient.get<OrderResponse[]>('/orders');
        
        const formattedData = data.map((order) => ({
          id: order.id,
          // Handle potential null name
          customer: order.user.name || order.user.email,
          total: `₹${order.totalPrice.toFixed(2)}`,
          status: order.status,
          date: new Date(order.createdAt).toLocaleDateString(),
          // Safe access for items
          itemsCount: order.items?.length || 0, 
        }));
        
        setOrders(formattedData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <div style={{textAlign:'center', padding:'40px'}}>Loading orders...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2><FontAwesomeIcon icon={faBoxOpen} /> Manage Orders</h2>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>No orders have been placed yet.</div>
      ) : (
        <div className={styles.orderList}>
          {orders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              
              {/* Header: ID and Status */}
              <div className={styles.cardHeader}>
                <div>
                  <h4>{order.customer}</h4>
                  <span className={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</span>
                </div>
                <span className={`${styles.statusBadge} ${styles[`status_${order.status}`]}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Body: Details */}
              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <span>Date</span>
                  <span><FontAwesomeIcon icon={faCalendarAlt} style={{marginRight:5, opacity:0.5}}/>{order.date}</span>
                </div>
                <div className={styles.infoRow}>
                  <span>Items</span>
                  <span>{order.itemsCount}</span>
                </div>
                <div className={styles.infoRow}>
                  <span>Total Amount</span>
                  <span className={styles.total}>{order.total}</span>
                </div>
              </div>

              {/* Footer: Action */}
              <div className={styles.cardActions}>
                <Link to={`/admin/orders/${order.id}`} className={styles.viewButton}>
                  View Details &rarr;
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;