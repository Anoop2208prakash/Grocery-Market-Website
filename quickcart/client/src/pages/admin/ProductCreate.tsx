import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import apiClient from '../../services/apiClient';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useToast } from '../../contexts/ToastContext';
import styles from './ProductCreate.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCarrot, faAppleWhole, faEgg, faBreadSlice,
  faFish, faGlassWater, faCookieBite, faWarehouse,
  faCamera
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'; // <-- 1. IMPORT THIS TYPE

// Type for the categories
interface Category {
  id: string;
  name: string;
}

// --- 2. THIS IS THE FIX ---
// Changed 'any' to 'IconDefinition'
const categoryIconMap: Record<string, IconDefinition> = {
  'Vegetables': faCarrot,
  'Fruits': faAppleWhole,
  'Dairy & Eggs': faEgg,
  'Bakery': faBreadSlice,
  'Meat & Fish': faFish,
  'Beverages': faGlassWater,
  'Snacks': faCookieBite,
  'Pantry': faWarehouse,
  'Default': faCarrot // Fallback
};
// --- END FIX ---

const ProductCreate = () => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [stock, setStock] = useState('0'); 
  
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get('/categories');
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    
    setUploading(true);
    try {
      const { data } = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImageUrl(data.imageUrl);
      setUploading(false);
      showToast('Image uploaded!', 'success');
      
    } catch (err) {
      console.error(err);
      showToast('Image upload failed', 'error');
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post('/products', {
        name, sku, price, description, categoryId, stock, imageUrl,
      });
      setLoading(false);
      showToast('Product created successfully!', 'success');
      navigate('/admin/inventory');
    } catch (err) {
      console.error(err);
      let message = 'Failed to create product';
      if (err instanceof AxiosError) message = err.response?.data?.message;
      setError(message);
      showToast(message, 'error');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Create New Product</h2>
        <Link to="/admin/inventory" className={styles.backLink}>
          &larr; Back to Inventory
        </Link>
      </div>
      
      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Product Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        
        <div className={styles.formGroup}>
          <label>SKU</label>
          <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} required />
        </div>

        <div className={styles.formGroup}>
          <label>Product Image</label>
          <div className={styles.imageUploader}>
            <input 
              id="file-upload"
              type="file" 
              onChange={handleFileUpload} 
              className={styles.fileInput}
              accept="image/png, image/jpeg, image/gif"
            />
            {imageUrl ? (
              <div className={styles.imagePreview}>
                <img src={`http://localhost:5000${imageUrl}`} alt="Preview" />
                <label htmlFor="file-upload" className={styles.changeButton}>
                  Change
                </label>
              </div>
            ) : (
              <label htmlFor="file-upload" className={styles.uploadBox}>
                <FontAwesomeIcon icon={faCamera} className={styles.icon} />
                <p>Upload Photo</p>
              </label>
            )}
            {uploading && <p>Uploading...</p>}
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label>Price (in Rupees)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>

        <div className={styles.formGroup}>
          <label>Initial Stock</label>
          <input 
            type="number" 
            value={stock} 
            onChange={(e) => setStock(e.target.value)} 
            required 
          />
        </div>

        <div className={styles.formGroup}>
          <label>Category</label>
          <div className={styles.categoryGrid}>
            {categories.map(cat => {
              const icon = categoryIconMap[cat.name] || categoryIconMap['Default'];
              return (
                <button
                  type="button"
                  key={cat.id}
                  className={`${styles.categoryItem} ${cat.id === categoryId ? styles.active : ''}`}
                  onClick={() => setCategoryId(cat.id)}
                >
                  <FontAwesomeIcon icon={icon} className={styles.icon} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>

        <button type="submit" disabled={loading || uploading} className={styles.submitButton}>
          {loading ? 'Saving...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
};

export default ProductCreate;