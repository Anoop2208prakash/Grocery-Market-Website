import { useCart } from '../../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState';
import styles from './CartPage.module.scss';
import { useAuth } from '../../contexts/AuthContext'; // <-- 1. Import Auth
import apiClient from '../../services/apiClient';  // <-- 2. Import API client
import { AxiosError } from 'axios';               // <-- 3. Import AxiosError
import { useState } from 'react';                  // <-- 4. Import useState

const CartPage = () => {
  // 5. Re-add clearCart and add other hooks
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth(); // Get user
  const navigate = useNavigate(); // Re-add navigate
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // 6. Update the checkout handler
  const handleCheckout = async () => {
    if (!user) {
      // If not logged in, redirect to login
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
      
      // Success!
      setLoading(false);
      clearCart(); // Empty the cart
      // We'll create this success page next
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

  if (cartItems.length === 0) {
    return (
      <EmptyState 
        title="Your cart is empty" 
        message="Looks like you haven't added any groceries yet."
      >
        <Link 
          to="/" 
          style={{textDecoration: 'none', background: 'blue', color: 'white', padding: '10px 15px', borderRadius: 4}}
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
              src={item.imageUrl || 'https://via.placeholder.com/150'} 
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

        {/* Show error if there is one */}
        {error && <p style={{ color: 'red', marginBottom: 15 }}>{error}</p>}

        <button 
          className={styles.checkoutButton}
          onClick={handleCheckout}
          disabled={loading} // 7. Disable button while loading
        >
          {loading ? 'Placing Order...' : 'Proceed to Checkout'}
        </button>
      </div>
    </div>
  );
};

export default CartPage;