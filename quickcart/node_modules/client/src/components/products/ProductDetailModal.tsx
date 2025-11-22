import Modal from '../common/Modal';
import { useProductModal } from '../../contexts/ProductModalContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import styles from './ProductDetailModal.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

const ProductDetailModal = () => {
  const { isOpen, selectedProduct, closeProductModal } = useProductModal();
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const { showToast } = useToast();

  if (!selectedProduct) return null;

  // Check cart state
  const cartItem = cartItems.find(item => item.id === selectedProduct.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const getImageUrl = (url?: string) => {
    const placeholder = 'https://via.placeholder.com/300x300.png?text=No+Image';
    if (!url) return placeholder;
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  const handleAddToCart = () => {
    addToCart({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      imageUrl: selectedProduct.imageUrl,
    });
    showToast('Added to cart', 'success');
  };

  const handleIncrement = () => updateQuantity(selectedProduct.id, quantity + 1);
  const handleDecrement = () => {
    if (quantity > 1) updateQuantity(selectedProduct.id, quantity - 1);
    else removeFromCart(selectedProduct.id);
  };

  return (
    <Modal isOpen={isOpen} onClose={closeProductModal}>
      <div className={styles.container}>
        <div className={styles.imageSection}>
          <img src={getImageUrl(selectedProduct.imageUrl)} alt={selectedProduct.name} />
        </div>

        <div className={styles.infoSection}>
          <h2>{selectedProduct.name}</h2>
          <div className={styles.price}>₹{selectedProduct.price.toFixed(2)}</div>
          
          <p className={styles.description}>
            {selectedProduct.description || "No description available for this fresh item."}
          </p>

          {selectedProduct.totalStock !== undefined && (
            <div className={styles.meta}>
              Stock Status: <span>{selectedProduct.totalStock > 0 ? 'In Stock' : 'Out of Stock'}</span>
            </div>
          )}

          <div className={styles.actions}>
            {quantity > 0 ? (
              <div className={styles.quantityControl}>
                <button onClick={handleDecrement}><FontAwesomeIcon icon={faMinus} /></button>
                <span>{quantity}</span>
                <button onClick={handleIncrement}><FontAwesomeIcon icon={faPlus} /></button>
              </div>
            ) : (
              <button className={styles.addButton} onClick={handleAddToCart}>
                Add to Cart - ₹{selectedProduct.price.toFixed(2)}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductDetailModal;