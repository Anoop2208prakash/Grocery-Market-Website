import { useCart } from '../../contexts/CartContext';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState';
import styles from './CartPage.module.scss';

// --- CONSTANTS ---
const FREE_DELIVERY_THRESHOLD = 500; 
const DELIVERY_FEE = 40; 

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, updateSubstitution } = useCart(); // Get updateSubstitution

  // 1. Calculate Subtotal
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // 2. Calculate Delivery Fee Logic
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryCharge = isFreeDelivery ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryCharge;

  // 3. Calculate Progress %
  const progress = Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const amountNeeded = FREE_DELIVERY_THRESHOLD - subtotal;

  // --- Image Helper ---
  const getImageUrl = (url?: string | null) => {
    const placeholderImg = 'https://via.placeholder.com/300x300.png?text=No+Image';
    if (!url) return placeholderImg;
    if (url.startsWith('http') || url.startsWith('https')) return url;
    return `http://localhost:5000${url}`;
  };

  if (cartItems.length === 0) {
    return (
      <EmptyState 
        title="Your cart is empty" 
        message="Looks like you haven't added any groceries yet."
      >
        <Link 
          to="/" 
          style={{textDecoration: 'none', background: '#31694E', color: 'white', padding: '10px 15px', borderRadius: 4}}
        >
          Start Shopping
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className={styles.cartPage}>
      <h1>Your Cart</h1>

      {/* --- Free Delivery Progress Bar --- */}
      <div className={styles.deliveryProgress}>
        {isFreeDelivery ? (
          <div className={styles.unlockedBadge}>
             🎉 You've unlocked <strong>Free Delivery!</strong>
          </div>
        ) : (
          <>
            <p>Add <span>₹{amountNeeded.toFixed(0)}</span> more for <strong>Free Delivery</strong></p>
            <div className={styles.progressBarBg}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </>
        )}
      </div>
      {/* --- End Progress Bar --- */}

      <div>
        {cartItems.map(item => (
          <div key={item.id} className={styles.item}>
            <img 
              src={getImageUrl(item.imageUrl)}
              alt={item.name} 
              className={styles.itemImage}
            />
            <div className={styles.itemDetails}>
              <h4>{item.name}</h4>
              <p>₹{item.price.toFixed(2)}</p>
              
              {/* --- NEW: Substitution Preference --- */}
              <div className={styles.subSelector}>
                <small>If unavailable:</small>
                <select 
                  value={item.substitution || 'REFUND'} 
                  onChange={(e) => updateSubstitution(item.id, e.target.value as 'REFUND' | 'REPLACE')}
                  className={styles.subDropdown}
                >
                  <option value="REFUND">Refund Money</option>
                  <option value="REPLACE">Find Replacement</option>
                </select>
              </div>
              {/* --- END NEW --- */}
            </div>

            <div className={styles.quantityControl}>
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
            </div>
            <button 
              className={styles.removeButton} 
              onClick={() => removeFromCart(item.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      
      <div className={styles.summary}>
        {/* Breakdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: isFreeDelivery ? 'green' : '#555' }}>
          <span>Delivery Fee:</span>
          <span>{isFreeDelivery ? 'FREE' : `₹${DELIVERY_FEE.toFixed(2)}`}</span>
        </div>
        <hr style={{ margin: '15px 0', borderTop: '1px dashed #ccc' }} />

        <h2 className={styles.total}>
          Total: ₹{total.toFixed(2)}
        </h2>

        {/* Link to Checkout */}
        <Link to="/checkout" className={styles.checkoutButton}>
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
};

export default CartPage;