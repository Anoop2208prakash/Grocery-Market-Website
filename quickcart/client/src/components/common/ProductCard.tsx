import styles from './ProductCard.module.scss';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    showToast(`${product.name} added to cart!`, 'success');
  };

  // --- This logic fixes broken images ---
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

  const imageSrc = getImageUrl(product.imageUrl);
  // --- End of image fix ---

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={imageSrc} alt={product.name} />
      </div>
      <h3 className={styles.name}>{product.name}</h3>
      <p className={styles.price}>₹{product.price.toFixed(2)}</p>
      <button
        className={styles.addButton}
        onClick={handleAddToCart}
      >
        <FontAwesomeIcon icon={faCartPlus} style={{ marginRight: '8px' }} />
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;