import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './DriverDashboard.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapMarkerAlt, 
  faCheckCircle, 
  faToggleOn, 
  faToggleOff, 
  faUser, 
  faBox, 
  faTruck
} from '@fortawesome/free-solid-svg-icons';

// --- Interfaces ---
interface Address {
  street: string;
  city: string;
  zip: string;
}
interface Order {
  id: string;
  totalPrice: number;
  status: string;
  user: { name: string; phone: string };
  address?: Address; 
  _count?: { items: number };
}
interface Delivery {
  id: string;
  status: string;
  order: Order;
}
interface DriverStats {
  completedOrders: number;
  totalEarnings: number;
  todayEarnings: number;
}

const DriverDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // --- State ---
  const [activeTab, setActiveTab] = useState<'jobs' | 'active' | 'earnings'>('jobs');
  const [isOnline, setIsOnline] = useState(true);
  
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<DriverStats>({ completedOrders: 0, totalEarnings: 0, todayEarnings: 0 });

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      const [availableRes, myRes, statsRes] = await Promise.all([
        apiClient.get('/delivery/available'),
        apiClient.get('/delivery/my-deliveries'),
        apiClient.get('/delivery/stats')
      ]);
      setAvailableOrders(availableRes.data);
      setMyDeliveries(myRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // --- Handlers ---
  const handleAccept = async (orderId: string) => {
    try {
      await apiClient.post(`/delivery/${orderId}/accept`);
      fetchData();
      setActiveTab('active'); // Switch to active tab automatically
    } catch (error) {
      console.error(error);
      alert('Failed to accept order');
    }
  };

  const handleComplete = async (deliveryId: string) => {
    try {
      await apiClient.put(`/delivery/${deliveryId}/complete`);
      fetchData();
      setActiveTab('earnings'); // Switch to earnings to see $$
    } catch (error) {
      console.error(error);
      alert('Failed to complete delivery');
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      
      {/* --- 1. Modern Header --- */}
      <div className={styles.header}>
        <div>
          <h1><FontAwesomeIcon icon={faTruck} /> Driver Portal</h1>
          <small>Hello, {user?.name}</small>
        </div>
        <button 
          className={styles.logoutButton} 
          onClick={() => { logout(); navigate('/auth/login'); }}
        >
          Logout
        </button>
      </div>

      {/* --- 2. Floating Status Bar --- */}
      <div className={styles.statusBar}>
        <span className={styles.statusLabel}>Availability Status</span>
        <div 
          className={`${styles.statusToggle} ${isOnline ? styles.online : styles.offline}`}
          onClick={() => setIsOnline(!isOnline)}
        >
          {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
          <FontAwesomeIcon icon={isOnline ? faToggleOn : faToggleOff} size="2x" />
        </div>
      </div>

      {/* --- 3. Tabs --- */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'jobs' ? styles.active : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          New Jobs
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'active' ? styles.active : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active ({myDeliveries.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'earnings' ? styles.active : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          Earnings
        </button>
      </div>

      {/* --- 4. Content Area --- */}
      <div className={styles.contentArea}>
        
        {/* JOBS TAB */}
        {activeTab === 'jobs' && (
          <>
            {!isOnline ? (
              <div className={styles.emptyState}>You are currently offline. Go Online to receive new delivery requests.</div>
            ) : availableOrders.length === 0 ? (
              <div className={styles.emptyState}>No jobs available nearby. Sit tight!</div>
            ) : (
              <div className={styles.cardList}>
                {availableOrders.map(order => (
                  <div key={order.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3>Order #{order.id.slice(-6)}</h3>
                      <span className={styles.badge}>₹50 Earning</span>
                    </div>
                    <div className={styles.infoRow}>
                      <FontAwesomeIcon icon={faUser} />
                      <span><strong>Customer:</strong> {order.user.name}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <FontAwesomeIcon icon={faBox} />
                      <span>{order._count?.items || 1} Items in order</span>
                    </div>
                    <div className={styles.infoRow}>
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      <span>
                        {order.address 
                          ? `${order.address.street}, ${order.address.city}`
                          : "Address details unavailable"}
                      </span>
                    </div>
                    <button className={`${styles.actionButton} ${styles.acceptBtn}`} onClick={() => handleAccept(order.id)}>
                      Accept Job
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ACTIVE TAB */}
        {activeTab === 'active' && (
          <>
            {myDeliveries.length === 0 ? (
              <div className={styles.emptyState}>No active deliveries. Go to "New Jobs" to pick one up.</div>
            ) : (
              <div className={styles.cardList}>
                {myDeliveries.map(del => (
                  <div key={del.id} className={styles.activeCard}>
                    <div className={styles.cardHeader}>
                      <h3>Current Delivery</h3>
                      <span className={styles.badge}>{del.status}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <FontAwesomeIcon icon={faUser} />
                      <span>{del.order.user.name} ({del.order.user.phone})</span>
                    </div>
                    <div className={styles.infoRow}>
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      <span>
                        {del.order.address 
                          ? `${del.order.address.street}, ${del.order.address.city}, ${del.order.address.zip}`
                          : "Address unavailable"}
                      </span>
                    </div>
                    <button className={`${styles.actionButton} ${styles.completeBtn}`} onClick={() => handleComplete(del.id)}>
                      <FontAwesomeIcon icon={faCheckCircle} /> Mark Delivered
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* EARNINGS TAB */}
        {activeTab === 'earnings' && (
          <div>
            <div className={styles.earningsGrid}>
              <div className={styles.statBox}>
                <h4>Today's Pay</h4>
                <p>₹{stats.todayEarnings}</p>
              </div>
              <div className={styles.statBox}>
                <h4>Delivered</h4>
                <p>{stats.completedOrders}</p>
              </div>
            </div>
            <div className={styles.statBox} style={{ marginTop: 15 }}>
              <h4>Total Lifetime Earnings</h4>
              <p>₹{stats.totalEarnings}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DriverDashboard;