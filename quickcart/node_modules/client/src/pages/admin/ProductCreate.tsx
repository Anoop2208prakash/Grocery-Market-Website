import { useState, useEffect, type FormEvent } from 'react';
import apiClient from '../../services/apiClient';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useToast } from '../../contexts/ToastContext'; // <-- 1. Import Toast
import styles from './ProductCreate.module.scss';

// Type for the categories
interface Category {
  id: string;
  name: string;
}

const ProductCreate = () => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [stock, setStock] = useState('0'); 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { showToast } = useToast(); // <-- 2. Get Hook

  // Fetch categories for the dropdown
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/products', {
        name,
        sku,
        price,
        description,
        categoryId,
        stock,
      });
      setLoading(false);
      
      // 3. Show Success Toast
      showToast('Product created successfully!', 'success');
      
      navigate('/admin/inventory');
    } catch (err) {
      console.error(err);
      let message = 'Failed to create product';
      if (err instanceof AxiosError && err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message);
      
      // 4. Show Error Toast
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
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.length === 0 ? (
              <option>Loading categories...</option>
            ) : (
              categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))
            )}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>

        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
};

export default ProductCreate;