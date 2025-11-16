import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import ProductCard from '../../components/common/ProductCard';
import styles from './CategoryPage.module.scss';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

const CategoryPage = () => {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { name } = useParams(); // <-- 1. Get 'name' from URL, not 'id'

  useEffect(() => {
    if (!name) {
      setError('No category specified.');
      setLoading(false);
      return;
    }

    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        // --- 2. Fetch from the new '/api/categories/name/' endpoint ---
        const { data } = await apiClient.get<Category>(`/categories/name/${name}`);
        setCategory(data);
        setError('');
      } catch (err) {
        console.error(err);
        let message = 'Failed to fetch category';
        if (err instanceof AxiosError) message = err.response?.data?.message || message;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [name]); // <-- 3. Re-run if the name changes

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div>
      <h1 className={styles.title}>
        {category?.name || 'Category'}
      </h1>
      
      {!category || category.products.length === 0 ? (
        <div className={styles.noResults}>No products found in this category.</div>
      ) : (
        <div className={styles.grid}>
          {category.products.map(product => (
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

export default CategoryPage;