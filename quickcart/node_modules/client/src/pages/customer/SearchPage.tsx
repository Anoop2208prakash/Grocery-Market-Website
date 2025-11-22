import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import ProductCard from '../../components/common/ProductCard';
import styles from './SearchPage.module.scss';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

const SearchPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchParams] = useSearchParams();
  
  // Get params from URL
  const query = searchParams.get('q') || '';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const categoryId = searchParams.get('categoryId');
  const sort = searchParams.get('sort');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Build query string for API
        const params = new URLSearchParams();
        if (query) params.append('search', query);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (categoryId) params.append('categoryId', categoryId);
        if (sort) params.append('sort', sort);

        const { data } = await apiClient.get<Product[]>(`/products?${params.toString()}`);
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [query, minPrice, maxPrice, categoryId, sort]);

  return (
    <div className={styles.container}>
        <div className={styles.resultsHeader}>
          <h1>
             {query ? <>Results for: <span>"{query}"</span></> : 'All Products'}
          </h1>
          <span>{products.length} items found</span>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : products.length === 0 ? (
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