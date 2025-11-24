import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import styles from '../../pages/packer/PackerDashboard.module.scss'; // Ensure path is correct
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faCheck, faPlay, faDolly 
} from '@fortawesome/free-solid-svg-icons';

interface Item {
  id: string;
  quantity: number;
  product: { name: string; sku: string; imageUrl?: string };
}

interface Order {
  id: string;
  status: string;
  items: Item[];
}

const PackerDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const { data } = await apiClient.get('/packer/orders');
      setOrders(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async (id: string) => {
    await apiClient.put(`/packer/${id}/start`);
    fetchOrders();
  };

  const handleReady = async (id: string) => {
    await apiClient.put(`/packer/${id}/ready`);
    fetchOrders();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>
          <FontAwesomeIcon icon={faDolly} /> Packer Portal
          <span>{orders.length} Pending</span>
        </h1>
        <button className={styles.logoutButton} onClick={() => { logout(); navigate('/auth/login'); }}>
          Logout
        </button>
      </div>

      {/* Grid Content */}
      <div className={styles.grid}>
        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <FontAwesomeIcon icon={faClipboardList} />
            <p>All orders packed! Good job.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className={`${styles.orderCard} ${styles[`status_${order.status}`]}`}>
              
              {/* Card Header */}
              <div className={styles.cardHeader}>
                <h3>#{order.id.slice(-6).toUpperCase()}</h3>
                <span className={`${styles.statusBadge} ${order.status === 'PACKING' ? styles.packing : styles.pending}`}>
                  {order.status === 'PACKING' ? 'In Progress' : 'To Pack'}
                </span>
              </div>

              {/* Item List (Scrollable) */}
              <div className={styles.itemList}>
                {order.items.map(item => (
                  <div key={item.id} className={styles.item}>
                    <img 
                      src={item.product.imageUrl ? `http://localhost:5000${item.product.imageUrl}` : 'https://via.placeholder.com/50'} 
                      alt="product" 
                    />
                    <div className={styles.itemDetails}>
                      <span className={styles.name}>{item.product.name}</span>
                      <span className={styles.sku}>{item.product.sku}</span>
                    </div>
                    <span className={styles.qtyBadge}>x{item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Footer Actions */}
              <div className={styles.cardFooter}>
                {order.status === 'CONFIRMED' && (
                  <button className={`${styles.actionButton} ${styles.start}`} onClick={() => handleStart(order.id)}>
                    <FontAwesomeIcon icon={faPlay} /> Start Packing
                  </button>
                )}
                {order.status === 'PACKING' && (
                  <button className={`${styles.actionButton} ${styles.finish}`} onClick={() => handleReady(order.id)}>
                    <FontAwesomeIcon icon={faCheck} /> Mark Ready
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PackerDashboard;