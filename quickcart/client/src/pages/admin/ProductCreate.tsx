import { useState, useEffect, type FormEvent } from 'react';
import apiClient from '../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';

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
  
  // --- 1. Add Stock State ---
  const [stock, setStock] = useState('0'); 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Fetch categories for the dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get('/categories');
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id); // Default to first category
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
        stock, // --- 2. Send stock to backend ---
      });
      setLoading(false);
      navigate('/admin/inventory'); // Go back to list on success
    } catch (err) {
      console.error(err);
      let message = 'Failed to create product';
      if (err instanceof AxiosError && err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create New Product</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        {/* Form fields... */}
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

        {/* --- 3. Add Stock Input --- */}
        <div style={{ marginBottom: 15 }}>
          <label>Initial Stock</label><br />
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
            {categories.length === 0 ? (
              <option>Loading categories...</option>
            ) : (
              categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))
            )}
          </select>
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>Description</label><br />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%' }} rows={4} />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ padding: '10px 15px' }}>
          {loading ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
};

export default ProductCreate;