import { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import { useToast } from '../../contexts/ToastContext';
import AddressSelector from '../../components/checkout/AddressSelector';
import styles from './CheckoutPage.module.scss';
import { faTag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// --- CONSTANTS ---
const FREE_DELIVERY_THRESHOLD = 500; 
const DELIVERY_FEE = 40; 

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  // Payment & Wallet State
  const [paymentMethod, setPaymentMethod] = useState('COD'); 
  const [walletBalance, setWalletBalance] = useState(0);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, amount: number} | null>(null);

  // --- CALCULATIONS ---
  
  // 1. Subtotal (Items only)
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // 2. Delivery Fee
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryCharge = isFreeDelivery ? 0 : DELIVERY_FEE;
  
  // 3. Total (Before Discount)
  const totalBeforeDiscount = subtotal + deliveryCharge;

  // 4. Discount
  const discount = appliedCoupon ? appliedCoupon.amount : 0;

  // 5. Final Pay (After Discount) - Cannot be negative
  const finalTotal = Math.max(0, totalBeforeDiscount - discount);

  // Fetch wallet balance on mount
  useEffect(() => {
    apiClient.get('/wallet').then(res => {
      setWalletBalance(res.data.walletBalance);
    }).catch(() => {});
  }, []);

  // Apply Coupon Logic
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const { data } = await apiClient.post('/coupons/validate', {
        code: couponCode,
        cartTotal: subtotal // Discounts apply to item total, not delivery fee
      });
      setAppliedCoupon({ code: data.code, amount: data.discountAmount });
      showToast(`Coupon applied! You saved ₹${data.discountAmount}`, 'success');
    } catch (err) {
      console.error(err);
      setAppliedCoupon(null);
      let msg = 'Invalid Coupon';
      if (err instanceof AxiosError && err.response?.data?.message) {
        msg = err.response.data.message;
      }
      showToast(msg, 'error');
    }
  };

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
        totalPrice: finalTotal, // Send final discounted total
        addressId: selectedAddressId,
        paymentMethod: paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
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
              disabled={walletBalance < finalTotal} 
            />
            <div className={styles.optionText}>
              <span>QuickCart Wallet</span>
              <small>Balance: ₹{walletBalance.toFixed(2)}</small>
              {walletBalance < finalTotal && <span className={styles.errorText}>(Insufficient Balance)</span>}
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
        
        {/* --- COUPON INPUT --- */}
        <div className={styles.couponSection}>
          <div className={styles.couponInputWrapper}>
            <FontAwesomeIcon icon={faTag} className={styles.tagIcon} />
            <input 
              type="text" 
              placeholder="Promo Code" 
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={!!appliedCoupon}
            />
            {appliedCoupon ? (
              <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className={styles.removeBtn}>❌</button>
            ) : (
              <button onClick={handleApplyCoupon} className={styles.applyBtn}>Apply</button>
            )}
          </div>
          {appliedCoupon && <p className={styles.successMsg}>Coupon Applied!</p>}
        </div>

        {/* --- BREAKDOWN --- */}
        <div className={styles.summaryItem}>
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>

        <div className={styles.summaryItem} style={{ color: isFreeDelivery ? 'green' : '#555' }}>
          <span>Delivery Fee</span>
          <span>{isFreeDelivery ? 'FREE' : `₹${DELIVERY_FEE.toFixed(2)}`}</span>
        </div>

        {appliedCoupon && (
          <div className={styles.summaryItem} style={{ color: '#16a34a', fontWeight: 'bold' }}>
            <span>Discount ({appliedCoupon.code})</span>
            <span>-₹{appliedCoupon.amount.toFixed(2)}</span>
          </div>
        )}

        <div className={styles.summaryItem} style={{ fontSize: '1.3rem', borderTop: '2px solid #fff', paddingTop: '10px', marginTop: '10px' }}>
          <strong>Total Pay</strong>
          <strong>₹{finalTotal.toFixed(2)}</strong>
        </div>

        {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}

        <button 
          className={styles.confirmButton}
          onClick={handleConfirmOrder}
          disabled={loading || cartItems.length === 0}
        >
          {loading ? 'Processing...' : `Pay ₹${finalTotal.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;