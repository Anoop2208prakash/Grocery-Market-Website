import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import styles from './OrderSuccess.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faPhone, faFileInvoice } from '@fortawesome/free-solid-svg-icons'; // 1. Import Invoice Icon
import TrackingTimeline from '../../components/orders/TrackingTimeline';

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
  const [order, setOrder] = useState<Order | null>(null);
  
  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const { data } = await apiClient.get(`/orders/${id}`);
        setOrder(data);
      } catch (error) {
        console.error("Failed to track order", error);
      }
    };

    // 1. Initial Fetch
    fetchOrder();

    // 2. Poll every 5 seconds for updates (Live Tracking!)
    const interval = setInterval(fetchOrder, 5000);
    
    return () => clearInterval(interval);
  }, [id]);

  // --- 3. NEW: Invoice Download Handler ---
  const handleDownloadInvoice = async () => {
    try {
      // Request the PDF as a 'blob' (binary large object)
      const response = await apiClient.get(`/invoice/${id}`, { 
        responseType: 'blob' 
      });
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a hidden link and click it to force download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id?.slice(-6)}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      alert("Could not download invoice. Please try again.");
    }
  };
  // --- END NEW ---

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

      {/* --- 4. Action Buttons Container --- */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
        {/* Invoice Button */}
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