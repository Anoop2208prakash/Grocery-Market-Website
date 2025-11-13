import styles from './ProductCard.module.scss';
import { useCart } from '../../contexts/CartContext'; // <-- 1. IMPORT USECART

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface ProductCardProps {
  product: Product;
  // onAddToCart prop is no longer needed
}

// A placeholder image
const placeholderImg = 'https://via.placeholder.com/150';

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart(); // <-- 2. GET ADDTOCART FROM CONTEXT

  const handleAddToCart = () => {
    // 3. CALL ADDTOCART WITH THE PRODUCT
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    alert(`${product.name} added to cart!`);
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={product.imageUrl || placeholderImg} alt={product.name} />
      </div>
      <h3 className={styles.name}>{product.name}</h3>
      <p className={styles.price}>₹{product.price.toFixed(2)}</p>
      <button
        className={styles.addButton}
        onClick={handleAddToCart} // <-- 4. USE THE HANDLER
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;