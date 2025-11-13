import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import styles from './OrderDetails.module.scss';
import type { OrderStatus } from '@prisma/client'; // Import enum type

// (These types should eventually move to a central types file)
interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string; sku: string };
}
interface Order {
  id: string;
  status: OrderStatus; // Use the imported type
  totalPrice: number;
  user: { name: string; email: string };
  items: OrderItem[];
}

// Prisma enum values for OrderStatus
// We can get this from the enum itself
const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PACKING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

const AdminOrderDetails = () => {
  const { id: orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<OrderStatus>('PENDING');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<Order>(`/orders/${orderId}`);
        setOrder(data);
        setStatus(data.status);
        setError('');
      } catch (err) {
        console.error(err);
        let msg = 'Failed to fetch order';
        if (err instanceof AxiosError) {
          msg = err.response?.data?.message || msg;
        } else if (err instanceof Error) {
          msg = err.message;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleStatusUpdate = async () => {
    try {
      setError(''); // Clear old errors
      const { data } = await apiClient.put<Order>(`/orders/${orderId}/status`, {
        status,
      });
      alert('Status updated!');
      setOrder(data); // Update order with fresh data from server
      setStatus(data.status);
    } catch (err) {
      console.error(err);
      let msg = 'Failed to update status';
      if (err instanceof AxiosError) {
        msg = err.response?.data?.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    }
  };

  if (loading) return <div>Loading order details...</div>;
  if (error) return <div style={{ color: 'red', marginBottom: 15 }}>Error: {error}</div>;
  if (!order) return <div>Order not found.</div>;

  return (
    <div className={styles.page}>
      <Link to="/admin/orders">&larr; Back to Orders</Link>
      <h1 style={{ wordBreak: 'break-all' }}>Order: {order.id}</h1>

      <div className={styles.grid}>
        <div className={styles.details}>
          <h2>Order Items</h2>
          <div className={styles.itemsList}>
            {order.items.map((item) => (
              <div key={item.id} className={styles.item}>
                <span>
                  {item.quantity} x {item.product.name}
                </span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <hr />
          <div className={styles.item}>
            <strong>Total</strong>
            <strong>₹{order.totalPrice.toFixed(2)}</strong>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.summary}>
            <h3>Customer</h3>
            <p>{order.user.name}</p>
            <p>{order.user.email}</p>
          </div>

          <div className={styles.actions} style={{ marginTop: 20 }}>
            <h3>Update Status</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className={styles.statusSelect}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button className={styles.saveButton} onClick={handleStatusUpdate}>
              Save Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;