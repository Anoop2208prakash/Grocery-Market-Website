import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import styles from './Inventory.module.scss';
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid';
import { useToast } from '../../contexts/ToastContext'; // 1. Import Toast
import DeleteModal from '../../components/common/DeleteModal'; // 2. Import Modal

// ... (Interfaces remain the same) ...
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const { showToast } = useToast(); // 3. Init Toast

  // 4. Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // 5. Handle "Delete" Click (Opens Modal)
  const onDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setIsModalOpen(true);
  };

  // 6. Confirm Delete (Actual API Call)
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await apiClient.delete(`/products/${productToDelete}`);
      
      // Update UI
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete));
      
      // Show Success Toast
      showToast('Product deleted successfully!', 'success');
      
    } catch (err) {
      console.error(err);
      showToast('Failed to delete product', 'error');
    } finally {
      // Close Modal
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
          {/* Pass ID to onDeleteClick instead of direct delete */}
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

  const addProductButton = (
    <Link to="/admin/inventory/new" className={styles.addButtonEmpty}>
      + Add Your First Product
    </Link>
  );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<Product[]>('/products');
        const formattedData = data.map(p => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category.name,
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
    fetchProducts();
  }, []);

  if (loading) return <div>Loading inventory...</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Manage Inventory</h2>
        {products.length > 0 && (
          <Link to="/admin/inventory/new" className={styles.addButton}>
            + Add Product
          </Link>
        )}
      </div>

      {error && <div style={{ color: 'red', marginBottom: '15px' }}>Error: {error}</div>}

      <DataGrid
        columns={columns}
        data={products}
        emptyTitle="No Products Found"
        emptyMessage="Get started by adding your first product to the inventory."
        emptyAction={addProductButton}
      />

      {/* 7. Render the Modal */}
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