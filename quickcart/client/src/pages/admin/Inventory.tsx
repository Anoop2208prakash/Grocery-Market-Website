import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import styles from './Inventory.module.scss';
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid';
import { useToast } from '../../contexts/ToastContext';
import DeleteModal from '../../components/common/DeleteModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFileCsv, faSpinner } from '@fortawesome/free-solid-svg-icons';

// Interfaces
interface ProductRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: string;
  stock: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  category: { name: string };
  totalStock: number;
}

const AdminInventory = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  
  // --- 1. Loading State ---
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  // --- CSV Upload State ---
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get<Product[]>('/products');
      const formattedData = data.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category?.name || 'Uncategorized',
        price: `₹${p.price.toFixed(2)}`,
        stock: p.totalStock,
      }));
      setProducts(formattedData);
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

  const columns: ColumnDef<ProductRow>[] = [
    { header: 'SKU', accessorKey: 'sku' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Category', accessorKey: 'category' },
    { header: 'Price', accessorKey: 'price' },
    { header: 'Stock', accessorKey: 'stock' },
    {
      header: 'Actions',
      cell: (row) => (
        <div className={styles.actionButtons}>
          <button
            onClick={() => navigate(`/admin/inventory/edit/${row.id}`)}
            className={styles.editButton}
          >
            Edit
          </button>
          <button
            onClick={() => onDeleteClick(row.id)} 
            className={styles.deleteButton}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  // --- 2. FIX: Use the 'loading' state here ---
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading inventory...</div>;
  }
  // --- END FIX ---

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Manage Inventory</h1>
        
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

      <div className={styles.tableWrapper}>
        <DataGrid
          columns={columns}
          data={products}
          emptyTitle="No Products Found"
          emptyMessage="Get started by adding your first product to the inventory."
        />
      </div>

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