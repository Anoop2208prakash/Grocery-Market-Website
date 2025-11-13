import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  totalPrice: number;
  status: string;
  user: { name: string };
  _count?: { items: number };
}

interface Delivery {
  id: string;
  status: string;
  order: Order;
}

const DriverDashboard = () => {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Delivery[]>([]);
  
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [availableRes, myRes] = await Promise.all([
        apiClient.get('/delivery/available'),
        apiClient.get('/delivery/my-deliveries')
      ]);
      setAvailableOrders(availableRes.data);
      setMyDeliveries(myRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (orderId: string) => {
    try {
      await apiClient.post(`/delivery/${orderId}/accept`);
      fetchData();
    } catch (error) {
      console.error(error); // <-- FIX: Log the error so it is "used"
      alert('Failed to accept order');
    }
  };

  const handleComplete = async (deliveryId: string) => {
    try {
      await apiClient.put(`/delivery/${deliveryId}/complete`);
      fetchData();
    } catch (error) {
      console.error(error); // <-- FIX: Log the error here too
      alert('Failed to complete delivery');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1>🚗 Driver Portal</h1>
        <button onClick={() => { logout(); navigate('/auth/login'); }}>Logout</button>
      </div>

      <div style={{ marginBottom: 40 }}>
        <h2>My Active Deliveries</h2>
        {myDeliveries.length === 0 ? <p>No active deliveries.</p> : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {myDeliveries.map(del => (
              <div key={del.id} style={{ border: '2px solid green', padding: 15, borderRadius: 8, background: '#f0fff4' }}>
                <h3>Order #{del.order.id.slice(-6)}</h3>
                <p>Customer: {del.order.user.name}</p>
                <p>Status: <strong>{del.status}</strong></p>
                <button 
                  onClick={() => handleComplete(del.id)}
                  style={{ background: 'green', color: 'white', padding: '10px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Mark Delivered ✅
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2>Available for Pickup</h2>
        {availableOrders.length === 0 ? <p>No orders waiting for pickup.</p> : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {availableOrders.map(order => (
              <div key={order.id} style={{ border: '1px solid #ccc', padding: 15, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h3>Order #{order.id.slice(-6)}</h3>
                  <span style={{ background: '#eee', padding: '2px 8px', borderRadius: 4 }}>{order.status}</span>
                </div>
                <p>Customer: {order.user.name}</p>
                <button 
                  onClick={() => handleAccept(order.id)}
                  style={{ background: 'blue', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Accept Order
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;