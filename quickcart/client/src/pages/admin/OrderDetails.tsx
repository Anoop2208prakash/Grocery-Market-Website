import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import { useToast } from '../../contexts/ToastContext';
import styles from './OrderDetails.module.scss';

// Define types
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PACKING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string; sku: string; imageUrl?: string };
}

interface Order {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
  user: { name: string; email: string };
  items: OrderItem[];
}

const ADMIN_ORDER_STATUSES: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PACKING'
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
      // FIX: Use the error object to log or get a specific message
      console.error("Status update failed:", err); 
      let msg = 'Failed to update status';
      if (err instanceof AxiosError) {
        msg = err.response?.data?.message || msg;
      }
      showToast(msg, 'error');
    }
  };

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/60';
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>Loading details...</div>;
  if (error && !order) return <div className={styles.container} style={{color:'red'}}>{error || 'Order not found'}</div>;
  
  // Guard against a fully null order
  if (!order) return <div className={styles.container}>Order not found.</div>;

  return (
    <div className={styles.container}>
      <Link to="/admin/orders" className={styles.backLink}>&larr; Back to Orders</Link>
      
      <div className={styles.header}>
        <h1>Order: <span>{order.id}</span></h1>
        <span>Placed on: {new Date(order.createdAt).toLocaleString()}</span>
      </div>

      <div className={styles.grid}>
        {/* LEFT COLUMN: ITEMS */}
        <div className={styles.itemsCard}>
          <h3>Order Items ({order.items?.length || 0})</h3>
          {/* FIX: Add optional chaining here */}
          {order.items?.map((item) => (
            <div key={item.id} className={styles.itemRow}>
              <img src={getImageUrl(item.product?.imageUrl)} alt={item.product?.name} />
              <div className={styles.itemInfo}>
                <h4>{item.product?.name || 'Unknown Product'}</h4>
                <p>SKU: {item.product?.sku || 'N/A'} &bull; Qty: {item.quantity}</p>
              </div>
              <span className={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className={styles.totalRow}>
            <span>Total</span>
            <span>₹{order.totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: INFO */}
        <div>
          <div className={styles.infoCard}>
            <h4>Customer Details</h4>
            <p>{order.user?.name || 'Guest Customer'}</p>
            <p className={styles.email}>{order.user?.email || 'No Email'}</p>
          </div>

          <div className={styles.statusCard}>
            <h4>Update Status</h4>
            
            {ADMIN_ORDER_STATUSES.includes(order.status) ? (
              <>
                <p style={{marginBottom: '10px'}}>Current: <strong>{order.status}</strong></p>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className={styles.statusSelect}
                  style={{ marginBottom: '10px' }}
                >
                  {ADMIN_ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button 
                  className={styles.saveButton}
                  onClick={handleStatusUpdate}
                >
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