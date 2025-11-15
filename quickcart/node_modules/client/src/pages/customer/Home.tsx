import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import ProductCard from '../../components/common/ProductCard';
import styles from './Home.module.scss';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<Product[]>('/products');
        setProducts(data);
        setError('');
      } catch (err) {
        console.error(err);
        let message = 'Failed to fetch products';
        if (err instanceof AxiosError && err.response?.data?.message) {
          message = err.response.data.message;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // const handleAddToCart = (productId: string) => { ... }; 
  // <-- 1. THIS FUNCTION IS REMOVED

  if (loading) return <div className={styles.loading}>Loading products...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div>
      <h1>Welcome to QuickCart!</h1>
      <div className={styles.grid}>
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            // onAddToCart={handleAddToCart} <-- 2. THIS PROP IS REMOVED
          />
        ))}
      </div>
    </div>
  );
};

export default Home;