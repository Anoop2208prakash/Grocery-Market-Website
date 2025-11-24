import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import styles from './OrderSuccess.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faPhone, faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import TrackingTimeline from '../../components/orders/TrackingTimeline';
import { useSocket } from '../../contexts/SocketContext'; // 1. Import Socket Hook

interface Order {
  id: string;
  status: string;
  delivery?: {
    driver?: {
      name: string;
      phone: string;
    };
  };
}

const OrderSuccess = () => {
  const { id } = useParams();
  const { socket } = useSocket(); // 2. Get socket instance
  const [order, setOrder] = useState<Order | null>(null);
  
  // 3. Initial Fetch & Socket Listener
  useEffect(() => {
    if (!id) return;

    // A. Fetch Order Data Immediately
    const fetchOrder = async () => {
      try {
        const { data } = await apiClient.get(`/orders/${id}`);
        setOrder(data);
      } catch (error) {
        console.error("Failed to track order", error);
      }
    };
    fetchOrder();

    // B. Listen for Real-Time Updates via Socket
    if (socket) {
      // Join the specific order room
      socket.emit('join_room', `order_${id}`);

      // Update state instantly when status changes
      socket.on('order_status_updated', (data: { status: string }) => {
        setOrder((prev) => prev ? { ...prev, status: data.status } : null);
      });

      // Cleanup listeners on unmount
      return () => {
        socket.off('order_status_updated');
      };
    }
  }, [id, socket]);

  // --- Invoice Download Handler ---
  const handleDownloadInvoice = async () => {
    try {
      const response = await apiClient.get(`/invoice/${id}`, { 
        responseType: 'blob' 
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id?.slice(-6)}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      alert("Could not download invoice. Please try again.");
    }
  };

  if (!order) return <div>Loading tracking info...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.successIcon}>
        <FontAwesomeIcon icon={faCheckCircle} />
      </div>
      
      <h1>Order Placed Successfully!</h1>
      <p className={styles.orderId}>Order ID: <span>#{order.id.slice(-6)}</span></p>

      {/* --- THE LIVE TIMELINE --- */}
      <TrackingTimeline status={order.status} />

      {/* Show Driver Info if Out for Delivery */}
      {order.status === 'OUT_FOR_DELIVERY' && order.delivery?.driver && (
        <div className={styles.driverCard}>
          <div>
            <h3>{order.delivery.driver.name} is on the way!</h3>
            <p>Arriving in 8 mins</p>
          </div>
          <a href={`tel:${order.delivery.driver.phone || '1234567890'}`}>
            <button className={styles.callButton}>
              <FontAwesomeIcon icon={faPhone} /> Call
            </button>
          </a>
        </div>
      )}

      {/* --- Action Buttons --- */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
        <button 
          onClick={handleDownloadInvoice}
          className={styles.invoiceButton}
          title="Download Invoice PDF"
        >
          <FontAwesomeIcon icon={faFileInvoice} /> Invoice
        </button>

        <Link to="/" className={styles.homeButton}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;