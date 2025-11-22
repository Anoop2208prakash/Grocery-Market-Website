import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import ProductCard from '../../components/common/ProductCard';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Home.module.scss';

// 1. Import Carousel and its styles
import "react-responsive-carousel/lib/styles/carousel.min.css"; 
import { Carousel } from 'react-responsive-carousel';

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
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  
  // 2. State for personalized products
  const [buyAgainProducts, setBuyAgainProducts] = useState<Product[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 3. Always fetch standard categories
        const categoryReq = apiClient.get<CategoryWithProducts[]>('/categories/products');
        
        // 4. Only fetch "Buy Again" if user is logged in
        const buyAgainReq = user 
          ? apiClient.get<Product[]>('/products/buy-again')
          : Promise.resolve({ data: [] });

        const [catRes, buyRes] = await Promise.all([categoryReq, buyAgainReq]);
        
        setCategories(catRes.data);
        setBuyAgainProducts(buyRes.data);
        setError('');
      } catch (err) {
        console.error(err);
        let message = 'Failed to load home page';
        if (err instanceof AxiosError && err.response?.data?.message) {
          message = err.response.data.message;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div>
      {/* --- 5. HERO CAROUSEL --- */}
      <div className={styles.carouselWrapper}>
        <Carousel 
          showThumbs={false} 
          showStatus={false} 
          infiniteLoop 
          autoPlay 
          interval={3000}
          showArrows={false}
        >
          <div className={styles.bannerSlide} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974')` }}>
            <div className={styles.bannerContent}>
              <h2>Fresh Vegetables</h2>
              <p>Farm fresh to your door in 10 mins.</p>
            </div>
          </div>
          <div className={styles.bannerSlide} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1974')` }}>
            <div className={styles.bannerContent}>
              <h2>Summer Fruits</h2>
              <p>Sweet, juicy, and ready to eat.</p>
            </div>
          </div>
          <div className={styles.bannerSlide} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1608198093002-ad4e005484ec?q=80&w=2032')` }}>
            <div className={styles.bannerContent}>
              <h2>Daily Essentials</h2>
              <p>Milk, Bread, and Eggs restocked daily.</p>
            </div>
          </div>
        </Carousel>
      </div>

      {/* --- 6. "BUY IT AGAIN" SECTION (Only if logged in & has history) --- */}
      {user && buyAgainProducts.length > 0 && (
        <section className={styles.categorySection}>
          <div className={styles.categoryHeader} style={{ borderLeftColor: '#BBC863' }}>
            <h2 className={styles.categoryTitle}>Buy It Again</h2>
          </div>
          <div className={styles.productRow}>
            {buyAgainProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* --- 7. STANDARD CATEGORIES --- */}
      {categories.map(category => (
        <section 
          key={category.id} 
          id={`category-${category.name}`} 
          className={styles.categorySection}
        >
          <div className={styles.categoryHeader}>
            <h2 className={styles.categoryTitle}>{category.name}</h2>
            
            <Link 
              to={`/category/${category.name}`} 
              className={styles.seeAllButton}
            >
              See All
            </Link>
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