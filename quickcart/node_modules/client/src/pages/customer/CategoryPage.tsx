import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import styles from './CategoryPage.module.scss';
import ProductCard from '../../components/common/ProductCard';

// Interfaces
interface SubCategory {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  subCategoryId?: string; // We use this to filter
  // ... other fields
}

interface CategoryData {
  id: string;
  name: string;
  subCategories: SubCategory[];
  products: Product[];
}

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>(); // This is the Category Name (e.g., 'Vegetables')
  const [data, setData] = useState<CategoryData | null>(null);
  const [activeSub, setActiveSub] = useState<string>('ALL');

  useEffect(() => {
    apiClient.get(`/categories/${id}`).then(res => {
      setData(res.data);
    }).catch(console.error);
  }, [id]);

  if (!data) return <div>Loading...</div>;

  // --- FILTER LOGIC ---
  const filteredProducts = activeSub === 'ALL' 
    ? data.products 
    : data.products.filter(p => p.subCategoryId === activeSub);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{data.name}</h1>

      {/* --- SUB-CATEGORY PILLS --- */}
      <div className={styles.subCategoryNav}>
        <button 
          className={`${styles.pill} ${activeSub === 'ALL' ? styles.active : ''}`}
          onClick={() => setActiveSub('ALL')}
        >
          All
        </button>
        {data.subCategories.map(sub => (
          <button 
            key={sub.id}
            className={`${styles.pill} ${activeSub === sub.id ? styles.active : ''}`}
            onClick={() => setActiveSub(sub.id)}
          >
            {sub.name}
          </button>
        ))}
      </div>

      {/* --- PRODUCT GRID --- */}
      <div className={styles.productGrid}>
        {filteredProducts.length > 0 ? (
           filteredProducts.map(product => (
             <ProductCard key={product.id} product={product} />
           ))
        ) : (
           <p>No products found in this subcategory.</p>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;