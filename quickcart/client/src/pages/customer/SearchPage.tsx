import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import ProductCard from '../../components/common/ProductCard';
import styles from './SearchPage.module.scss';

// Type to match the product data from the API
interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

const SearchPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q'); // Gets 'bread' from /search?q=bread

  useEffect(() => {
    if (!query) {
      setError('Please enter a search term.');
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Call API with the search query (using the backend fix)
        const { data } = await apiClient.get<Product[]>(`/products?search=${query}`);
        setProducts(data);
        setError('');
      } catch (err) {
        console.error(err);
        let message = 'Failed to fetch products';
        if (err instanceof AxiosError) message = err.response?.data?.message || message;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query]); // Re-run search every time the URL query changes

  if (loading) return <div className={styles.loading}>Searching...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div>
      <h1 className={styles.title}>
        Search Results for: <span>"{query}"</span>
      </h1>
      
      {products.length === 0 ? (
        <div className={styles.noResults}>No products found matching your search.</div>
      ) : (
        <div className={styles.grid}>
          {products.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;