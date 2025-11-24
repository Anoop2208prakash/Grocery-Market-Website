import { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import { useToast } from '../../contexts/ToastContext';
import AddressSelector from '../../components/checkout/AddressSelector';
import styles from './CheckoutPage.module.scss';

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  // --- NEW STATES ---
  const [paymentMethod, setPaymentMethod] = useState('COD'); // Default COD
  const [walletBalance, setWalletBalance] = useState(0);

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Fetch wallet balance on mount
  useEffect(() => {
    apiClient.get('/wallet').then(res => {
      setWalletBalance(res.data.walletBalance);
    }).catch(() => {/* ignore error if wallet fails to load */});
  }, []);

  const handleConfirmOrder = async () => {
    if (!user) {
      navigate('/auth/login?redirect=/checkout');
      return;
    }
    if (!selectedAddressId) {
      showToast('Please select a delivery address', 'error');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const { data: newOrder } = await apiClient.post('/orders', {
        cartItems: cartItems,
        totalPrice: total,
        addressId: selectedAddressId,
        paymentMethod: paymentMethod, // <-- Send selected method
      });
      
      setLoading(false);
      clearCart();
      navigate(`/order-success/${newOrder.id}`);

    } catch (err) {
      console.error(err);
      let message = 'Checkout failed';
      if (err instanceof AxiosError && err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message);
      showToast(message, 'error');
      setLoading(false);
    }
  };

  return (
    <div className={styles.grid}>
      {/* Left Column */}
      <div className={styles.leftColumn}>
        <AddressSelector 
          selectedAddressId={selectedAddressId}
          onSelect={setSelectedAddressId}
        />
        
        {/* --- PAYMENT METHOD SECTION --- */}
        <div className={styles.paymentSection}>
          <h3>Payment Method</h3>
          
          <label className={`${styles.paymentOption} ${paymentMethod === 'WALLET' ? styles.selected : ''}`}>
            <input 
              type="radio" 
              name="payment" 
              value="WALLET" 
              checked={paymentMethod === 'WALLET'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={walletBalance < total} // Disable if not enough money
            />
            <div className={styles.optionText}>
              <span>QuickCart Wallet</span>
              <small>Balance: ₹{walletBalance.toFixed(2)}</small>
              {walletBalance < total && <span className={styles.errorText}>(Insufficient Balance)</span>}
            </div>
          </label>

          <label className={`${styles.paymentOption} ${paymentMethod === 'UPI' ? styles.selected : ''}`}>
            <input 
              type="radio" 
              name="payment" 
              value="UPI" 
              checked={paymentMethod === 'UPI'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <div className={styles.optionText}>
              <span>UPI (GPay, PhonePe, Paytm)</span>
            </div>
          </label>

          <label className={`${styles.paymentOption} ${paymentMethod === 'COD' ? styles.selected : ''}`}>
            <input 
              type="radio" 
              name="payment" 
              value="COD" 
              checked={paymentMethod === 'COD'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <div className={styles.optionText}>
              <span>Cash on Delivery</span>
            </div>
          </label>
        </div>
        {/* --- END PAYMENT SECTION --- */}

      </div>

      {/* Right Column: Summary */}
      <div className={styles.summary}>
        <h2 className={styles.total}>Order Summary</h2>
        <div className={styles.itemList}>
          {cartItems.map(item => (
            <div key={item.id} className={styles.summaryItem}>
              <span>{item.quantity} x {item.name}</span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <hr />
        <div className={styles.summaryItem}>
          <strong>Total</strong>
          <strong>₹{total.toFixed(2)}</strong>
        </div>

        {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}

        <button 
          className={styles.confirmButton}
          onClick={handleConfirmOrder}
          disabled={loading || cartItems.length === 0}
        >
          {loading ? 'Processing...' : `Pay with ${paymentMethod === 'COD' ? 'Cash' : paymentMethod}`}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;