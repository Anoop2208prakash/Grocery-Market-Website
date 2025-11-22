import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import ProductCard from '../../components/common/ProductCard';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Home.module.scss';

// Carousel Imports
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

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
}

const Home = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [buyAgainProducts, setBuyAgainProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const categoryReq = apiClient.get<CategoryWithProducts[]>('/categories/products');
        
        const buyAgainReq = user 
          ? apiClient.get<Product[]>('/products/buy-again')
          : Promise.resolve({ data: [] });

        const bannersReq = apiClient.get<Banner[]>('/banners');

        const [catRes, buyRes, banRes] = await Promise.all([categoryReq, buyAgainReq, bannersReq]);
        
        setCategories(catRes.data);
        setBuyAgainProducts(buyRes.data);
        setBanners(banRes.data);
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
      {/* --- HERO CAROUSEL --- */}
      <div className={styles.carouselWrapper}>
        <Carousel 
          showThumbs={false} 
          showStatus={false} 
          infiniteLoop 
          autoPlay 
          interval={3000}
          showArrows={false}
        >
          {/* --- vvv THIS WAS THE FIX (ADDED CURLY BRACES) vvv --- */}
          {banners.length > 0 ? (
            banners.map(banner => (
              <div 
                key={banner.id} 
                className={styles.bannerSlide} 
                style={{ backgroundImage: `url('http://localhost:5000${banner.imageUrl}')` }}
              >
                <div className={styles.bannerContent}>
                  <h2>{banner.title}</h2>
                  <p>{banner.subtitle}</p>
                </div>
              </div>
            ))
          ) : (
            // Fallback to Static Banners
            [
              <div key="static1" className={styles.bannerSlide} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974')` }}>
                <div className={styles.bannerContent}>
                  <h2>Fresh Vegetables</h2>
                  <p>Farm fresh to your door in 10 mins.</p>
                </div>
              </div>,
              <div key="static2" className={styles.bannerSlide} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1974')` }}>
                <div className={styles.bannerContent}>
                  <h2>Summer Fruits</h2>
                  <p>Sweet, juicy, and ready to eat.</p>
                </div>
              </div>
            ]
          )}
          {/* --- ^^^ END FIX ^^^ --- */}
        </Carousel>
      </div>

      {/* --- "BUY IT AGAIN" SECTION --- */}
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

      {/* --- STANDARD CATEGORIES --- */}
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