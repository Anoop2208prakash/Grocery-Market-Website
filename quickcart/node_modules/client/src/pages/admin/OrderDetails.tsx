import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import { useToast } from '../../contexts/ToastContext';
import styles from './OrderDetails.module.scss';
import type { OrderStatus } from '@prisma/client';

// Define the types for the order data
interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string; sku: string };
}
interface Order {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  user: { name: string; email: string };
  items: OrderItem[];
}

// The statuses an Admin can manually set
const ADMIN_ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PACKING',
];

const AdminOrderDetails = () => {
  const { id: orderId } = useParams();
  const { showToast } = useToast();

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
        if (err instanceof AxiosError) msg = err.response?.data?.message || msg;
        
        setError(msg);
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, showToast]);

  const handleStatusUpdate = async () => {
    try {
      setError('');
      const { data } = await apiClient.put<Order>(`/orders/${orderId}/status`, {
        status,
      });

      showToast('Status updated successfully!', 'success');
      setOrder(data);
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
      showToast(msg, 'error');
    }
  };

  if (loading) return <div>Loading order details...</div>;
  if (error && !order) return <div style={{ color: 'red' }}>Error: {error}</div>;
  
  // Guard against a fully null order
  if (!order) return <div>Order not found.</div>;

  return (
    <div className={styles.page}>
      <Link to="/admin/orders">&larr; Back to Orders</Link>
      <h1 style={{ wordBreak: 'break-all' }}>Order: {order.id}</h1>

      {error && !loading && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        <div className={styles.details}>
          <h2>Order Items</h2>
          <div className={styles.itemsList}>
            {(order.items || []).map((item) => (
              <div key={item.id} className={styles.item}>
                <span>
                  {/* vvv THIS IS THE FIX vvv */}
                  {item.quantity} x {item.product?.name || 'Product Not Found'}
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
            {/* vvv THIS IS THE FIX vvv */}
            <p>{order.user?.name || 'Customer Not Found'}</p>
            <p>{order.user?.email || 'No Email'}</p>
          </div>

          <div className={styles.actions} style={{ marginTop: 20 }}>
            <h3>Update Status</h3>
            
            {ADMIN_ORDER_STATUSES.includes(order.status) ? (
              <>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className={styles.statusSelect}
                >
                  {ADMIN_ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button className={styles.saveButton} onClick={handleStatusUpdate}>
                  Save Status
                </button>
              </>
            ) : (
              <div style={{ padding: '10px', background: '#eee', borderRadius: '6px' }}>
                <strong>Current Status:</strong> {order.status}
                <br />
                <small>(Managed by Driver)</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;