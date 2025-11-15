import { useState, useEffect, type FormEvent } from 'react';
import apiClient from '../../services/apiClient';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useToast } from '../../contexts/ToastContext'; // <-- 1. Import Toast
import styles from './ProductEdit.module.scss';

interface Category {
  id: string;
  name: string;
}

interface ProductData {
  name: string;
  sku: string;
  price: number;
  description: string;
  categoryId: string;
  stock: number;
}

const ProductEdit = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast(); // <-- 2. Get Hook

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState('');
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

        setCategories(categoriesRes.data);

      } catch (err) {
        console.error(err);
        let message = 'Failed to load data';
        if (err instanceof AxiosError && err.response?.data?.message) {
          message = err.response.data.message;
        }
        setError(message);
        showToast(message, 'error'); // Optional: Toast on load error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, showToast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.put(`/products/${productId}`, {
        name,
        sku,
        price,
        description,
        categoryId,
        stock,
      });
      setLoading(false);
      
      // 3. Show Success Toast
      showToast('Product updated successfully!', 'success');
      
      navigate('/admin/inventory');
    } catch (err) {
      console.error(err);
      let message = 'Failed to update product';
      if (err instanceof AxiosError && err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message);
      
      // 4. Show Error Toast
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
          <label>Price (in Rupees)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>

        <div className={styles.formGroup}>
          <label>Stock Quantity</label>
          <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
        </div>

        <div className={styles.formGroup}>
          <label>Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>

        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'Updating...' : 'Update Product'}
        </button>
      </form>
    </div>
  );
};

export default ProductEdit;