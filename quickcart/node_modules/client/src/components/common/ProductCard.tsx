import styles from './ProductCard.module.scss';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useProductModal } from '../../contexts/ProductModalContext'; // <-- 1. Re-import this
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import React from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  totalStock?: number;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const { showToast } = useToast();
  const { openProductModal } = useProductModal(); // <-- 2. Get the open function

  // Check cart state
  const cartItem = cartItems.find(item => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  // --- Handlers ---

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    showToast(`${product.name} added to cart!`, 'success');
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    } else {
      removeFromCart(product.id);
      showToast(`${product.name} removed from cart`, 'error');
    }
  };

  // --- Image Helper ---
  const getImageUrl = (url?: string | null) => {
    const placeholderImg = 'https://via.placeholder.com/300x300.png?text=No+Image';
    if (!url) return placeholderImg;
    if (url.startsWith('http') || url.startsWith('https')) return url;
    return `http://localhost:5000${url}`;
  };

  return (
    <div 
      className={styles.card} 
      onClick={() => openProductModal(product)} // <-- 3. Re-add the click handler
      style={{ cursor: 'pointer' }} 
    >
      <div className={styles.imageWrapper}>
        <img src={getImageUrl(product.imageUrl)} alt={product.name} />
      </div>
      
      <h3 className={styles.name}>{product.name}</h3>
      <p className={styles.price}>₹{product.price.toFixed(2)}</p>
      
      {/* 4. Quantity Controls / Add Button */}
      {quantity > 0 ? (
        <div className={styles.quantityControl} onClick={(e) => e.stopPropagation()}>
          <button onClick={handleDecrement} className={styles.qtyBtn}>
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <span className={styles.qtyValue}>{quantity}</span>
          <button onClick={handleIncrement} className={styles.qtyBtn}>
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
      ) : (
        <button className={styles.addButton} onClick={handleAddToCart}>
          <FontAwesomeIcon icon={faCartPlus} style={{ marginRight: '8px' }} />
          Add to Cart
        </button>
      )}
    </div>
  );
};

export default ProductCard;