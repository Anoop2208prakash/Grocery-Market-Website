import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import styles from './Inventory.module.scss';
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid';

// Define the shape of our Product data
interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  category: {
    name: string;
  };
  totalStock: number; // <-- 1. Added stock field from API
}

// Define the data type we'll actually pass to the grid
interface ProductRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: string;
  stock: number; // <-- 2. Added stock field for the grid
}

const AdminInventory = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // --- Handle Delete Function ---
  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    try {
      await apiClient.delete(`/products/${productId}`);
      // Refresh list by filtering out the deleted product
      setProducts((prevProducts) =>
        prevProducts.filter((p) => p.id !== productId)
      );
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error(err);
      let message = 'Failed to delete product';
      if (err instanceof AxiosError && err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message); // Show error to user
    }
  };

  // --- Updated Column Definitions ---
  const columns: ColumnDef<ProductRow>[] = [
    { header: 'SKU', accessorKey: 'sku' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Category', accessorKey: 'category' },
    { header: 'Price', accessorKey: 'price' },
    { header: 'Stock', accessorKey: 'stock' }, // <-- 3. Added Stock Column
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
            onClick={() => handleDelete(row.id)}
            className={styles.deleteButton}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  // --- Add" button for the empty state ---
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
        
        // Transform data for the grid
        const formattedData = data.map(p => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category.name,
          price: `₹${p.price.toFixed(2)}`,
          stock: p.totalStock, // <-- 4. Map API data to grid row
        }));
        
        setProducts(formattedData);
        setError('');
      } catch (err) {
        console.error(err);
        let message = 'Failed to fetch products';
        if (err instanceof AxiosError && err.response?.data?.message) {
          message = err.response.data.message;
        }
        setError(message);
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
        {/* Show Add button only if there is data */}
        {products.length > 0 && (
          <Link to="/admin/inventory/new" className={styles.addButton}>
            + Add Product
          </Link>
        )}
      </div>

      {/* Show error message if there is one */}
      {error && <div style={{ color: 'red', marginBottom: '15px' }}>Error: {error}</div>}

      {/* Render the DataGrid */}
      <DataGrid
        columns={columns}
        data={products}
        emptyTitle="No Products Found"
        emptyMessage="Get started by adding your first product to the inventory."
        emptyAction={addProductButton}
      />
    </div>
  );
};

export default AdminInventory;