import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import styles from './Inventory.module.scss';
import { useToast } from '../../contexts/ToastContext';
import DeleteModal from '../../components/common/DeleteModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFileCsv, faSpinner, faBoxOpen, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  category: { name: string };
  totalStock: number;
}

const AdminInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get<Product[]>('/products');
      setProducts(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('csv', file);

    try {
      const { data } = await apiClient.post('/products/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(data.message, 'success');
      fetchProducts(); 
    } catch (err) {
      console.error(err);
      showToast('Failed to upload CSV', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const onDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await apiClient.delete(`/products/${productToDelete}`);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete));
      showToast('Product deleted successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete product', 'error');
    } finally {
      setIsModalOpen(false);
      setProductToDelete(null);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading inventory...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1><FontAwesomeIcon icon={faBoxOpen} /> Manage Inventory</h1>
        
        <div className={styles.actions}>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileUpload}
          />
          <button 
            className={styles.importButton} 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <FontAwesomeIcon icon={uploading ? faSpinner : faFileCsv} spin={uploading} />
            {uploading ? ' Uploading...' : ' Import CSV'}
          </button>

          <Link to="/admin/inventory/new" className={styles.createButton}>
            <FontAwesomeIcon icon={faPlus} /> Add Product
          </Link>
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '15px' }}>Error: {error}</div>}

      {/* --- New Card Grid View --- */}
      <div className={styles.gridList}>
        {products.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
            No products found. Add one to get started!
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} className={styles.productCard}>
              
              <div className={styles.productInfo}>
                <h4>{product.name}</h4>
                <div>
                  <span className={styles.sku}>{product.sku}</span>
                  <span className={styles.category}>{product.category?.name || 'Uncategorized'}</span>
                </div>
              </div>

              <div style={{display:'flex', alignItems:'center'}}>
                <div className={styles.productMeta}>
                  <div className={styles.price}>₹{product.price.toFixed(2)}</div>
                  <div className={styles.stock}>Stock: <span>{product.totalStock}</span></div>
                </div>

                <div className={styles.cardActions}>
                  <button 
                    onClick={() => navigate(`/admin/inventory/edit/${product.id}`)}
                    className={styles.editBtn}
                  >
                    <FontAwesomeIcon icon={faPen} /> Edit
                  </button>
                  <button 
                    onClick={() => onDeleteClick(product.id)}
                    className={styles.deleteBtn}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Remove
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
      {/* --- End Card Grid --- */}

      <DeleteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message="Are you sure you want to remove this product? This will remove it from the store immediately."
      />
    </div>
  );
};

export default AdminInventory;