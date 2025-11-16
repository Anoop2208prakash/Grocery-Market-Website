import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import apiClient from '../../services/apiClient';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useToast } from '../../contexts/ToastContext';
import styles from './ProductEdit.module.scss'; // Use the Edit SCSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCarrot, faAppleWhole, faEgg, faBreadSlice,
  faFish, faGlassWater, faCookieBite, faWarehouse,
  faCamera
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'; // <-- 1. IMPORT THIS TYPE

// --- Types & Icon Map ---
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
  'Default': faCarrot
};
// --- END FIX ---

interface ProductData {
  name: string;
  sku: string;
  price: number;
  description: string;
  categoryId: string;
  stock: number;
  imageUrl?: string;
}

const ProductEdit = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) {
        setError('No product ID provided');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [productRes, categoriesRes] = await Promise.all([
          apiClient.get<ProductData>(`/products/${productId}`),
          apiClient.get<Category[]>('/categories')
        ]);
        const product = productRes.data;
        setName(product.name);
        setSku(product.sku);
        setPrice(String(product.price));
        setDescription(product.description || '');
        setCategoryId(product.categoryId);
        setStock(String(product.stock));
        setImageUrl(product.imageUrl || '');
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error(err);
        let message = 'Failed to load data';
        if (err instanceof AxiosError) message = err.response?.data?.message;
        setError(message);
        showToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId, showToast]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    
    setUploading(true);
    try {
      const { data } = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(data.imageUrl);
      setUploading(false);
      showToast('Image updated!', 'success');
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
      await apiClient.put(`/products/${productId}`, {
        name, sku, price, description, categoryId, stock, imageUrl,
      });
      setLoading(false);
      showToast('Product updated successfully!', 'success');
      navigate('/admin/inventory');
    } catch (err) {
      console.error(err);
      let message = 'Failed to update product';
      if (err instanceof AxiosError) message = err.response?.data?.message;
      setError(message);
      showToast(message, 'error');
      setLoading(false);
    }
  };

  if (loading) return <div>Loading product data...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Edit Product</h2>
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
          <label>Stock Quantity</label>
          <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
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
          {loading ? 'Updating...' : 'Update Product'}
        </button>
      </form>
    </div>
  );
};

export default ProductEdit;