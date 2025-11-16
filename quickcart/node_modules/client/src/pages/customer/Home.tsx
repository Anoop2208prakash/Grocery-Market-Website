import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import ProductCard from '../../components/common/ProductCard';
import styles from './Home.module.scss';

// Define the data structures
interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface CategoryWithProducts {
  id: string;
  name: string;
  products: Product[];
}

const Home = () => {
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategorizedProducts = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<CategoryWithProducts[]>('/categories/products');
        setCategories(data);
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

    fetchCategorizedProducts();
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div>
      <div className={styles.banner}></div>
      
      {categories.map(category => (
        <section 
          key={category.id} 
          id={`category-${category.name}`} // This id is for the anchor link from the icon bar
          className={styles.categorySection}
        >
          <div className={styles.categoryHeader}>
            <h2 className={styles.categoryTitle}>{category.name}</h2>
            
            {/* --- vvv THIS IS THE FIX vvv --- */}
            <Link 
              to={`/category/${category.name}`} // Link by name, not id
              className={styles.seeAllButton}
            >
              See All
            </Link>
            {/* --- ^^^ END FIX ^^^ --- */}

          </div>
          
          <div className={styles.productRow}>
            {category.products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default Home;