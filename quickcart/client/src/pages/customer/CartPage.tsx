import { useCart } from '../../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState';
import styles from './CartPage.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import { useState } from 'react';

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (!user) {
      navigate('/auth/login?redirect=/cart');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const { data: newOrder } = await apiClient.post('/orders', {
        cartItems: cartItems,
        totalPrice: total,
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
      setLoading(false);
    }
  };

  // --- vvv THIS IS THE FIX vvv ---
  const getImageUrl = (url?: string | null) => {
    const placeholderImg = 'https://via.placeholder.com/300x300.png?text=No+Image';

    // If url is null, undefined, or an empty string
    if (!url) {
      return placeholderImg;
    }
    
    // If url is external (from seed file), use it directly
    if (url.startsWith('http') || url.startsWith('https://')) {
      return url;
    }

    // Otherwise, it's a local upload, so add the server path
    return `http://localhost:5000${url}`;
  };
  // --- ^^^ END FIX ^^^ ---

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
      <div>
        {cartItems.map(item => (
          <div key={item.id} className={styles.item}>
            <img 
              src={getImageUrl(item.imageUrl)} // <-- APPLY THE FIX HERE
              alt={item.name} 
              className={styles.itemImage}
            />
            <div className={styles.itemDetails}>
              <h4>{item.name}</h4>
              <p>₹{item.price.toFixed(2)}</p>
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
        <h2 className={styles.total}>
          Subtotal: ₹{total.toFixed(2)}
        </h2>

        {error && <p style={{ color: 'red', marginBottom: 15 }}>{error}</p>}

        <button 
          className={styles.checkoutButton}
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? 'Placing Order...' : 'Proceed to Checkout'}
        </button>
      </div>
    </div>
  );
};

export default CartPage;