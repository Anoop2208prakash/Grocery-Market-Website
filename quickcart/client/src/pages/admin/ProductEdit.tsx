import { useState, useEffect, type FormEvent } from 'react';
import apiClient from '../../services/apiClient';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AxiosError } from 'axios';

interface Category {
  id: string;
  name: string;
}

// Product data received from API
interface ProductData {
  name: string;
  sku: string;
  price: number;
  description: string;
  categoryId: string;
  stock: number; // <-- 1. Add stock field
}

const ProductEdit = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState(''); // <-- 2. Add stock state
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch categories and product data
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
        setStock(String(product.stock)); // <-- 3. Set stock from API

        setCategories(categoriesRes.data);

      } catch (err) {
        console.error(err);
        let message = 'Failed to load data';
        if (err instanceof AxiosError && err.response?.data?.message) {
          message = err.response.data.message;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

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
        stock, // <-- 4. Send updated stock
      });
      setLoading(false);
      navigate('/admin/inventory');
    } catch (err) {
      console.error(err);
      let message = 'Failed to update product';
      if (err instanceof AxiosError && err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading product data...</div>;

  return (
    <div>
      <Link to="/admin/inventory" style={{ marginBottom: 15, display: 'inline-block' }}>
        &larr; Back to Inventory
      </Link>
      <h2>Edit Product</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 15 }}>
          <label>Product Name</label><br />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>SKU</label><br />
          <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>Price (in Rupees)</label><br />
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ width: '100%' }} />
        </div>

        {/* --- 5. Add Stock Input --- */}
        <div style={{ marginBottom: 15 }}>
          <label>Stock Quantity</label><br />
          <input 
            type="number" 
            value={stock} 
            onChange={(e) => setStock(e.target.value)} 
            required 
            style={{ width: '100%' }} 
          />
        </div>
        {/* --- End Stock Input --- */}

        <div style={{ marginBottom: 15 }}>
          <label>Category</label><br />
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: '100%' }}>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>Description</label><br />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%' }} rows={4} />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '10px 15px' }}>
          {loading ? 'Updating...' : 'Update Product'}
        </button>
      </form>
    </div>
  );
};

export default ProductEdit;