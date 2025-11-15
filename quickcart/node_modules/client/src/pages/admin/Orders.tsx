import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid';
import { useNavigate } from 'react-router-dom'; // <-- 1. Import useNavigate
import styles from './Orders.module.scss'; // <-- 2. Import SCSS

// Define the shape of our Order data from the API
interface Order {
  id: string;
  user: {
    name: string;
    email: string;
  };
  totalPrice: number;
  status: string;
  createdAt: string;
}

// Define the data type we'll pass to the grid
interface OrderRow {
  id: string;
  customer: string;
  total: string;
  status: string;
  date: string;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate(); // <-- 3. Initialize Hook

  // --- 4. Define Columns with "Actions" ---
  const columns: ColumnDef<OrderRow>[] = [
    { header: 'Order ID', accessorKey: 'id' },
    { header: 'Customer', accessorKey: 'customer' },
    { header: 'Total', accessorKey: 'total' },
    { 
      header: 'Status', 
      // Custom cell to render colored badges
      cell: (row) => (
        <span className={`${styles.statusBadge} ${styles[row.status.toLowerCase()]}`}>
          {row.status.replace(/_/g, ' ')}
        </span>
      )
    },
    { header: 'Date', accessorKey: 'date' },
    {
      header: 'Actions',
      // vvv THIS IS THE MISSING BUTTON vvv
      cell: (row) => (
        <button 
          className={styles.viewButton}
          onClick={() => navigate(`/admin/orders/${row.id}`)}
        >
          View Details
        </button>
      ),
      // ^^^ --------------------------- ^^^
    },
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<Order[]>('/orders');
        
        const formattedData = data.map(order => ({
          id: order.id,
          customer: order.user.name || order.user.email,
          total: `₹${order.totalPrice.toFixed(2)}`,
          status: order.status,
          date: new Date(order.createdAt).toLocaleDateString(),
        }));
        
        setOrders(formattedData);
        setError('');
      } catch (err) {
        console.error(err);
        let message = 'Failed to fetch orders';
        if (err instanceof AxiosError && err.response?.data?.message) {
          message = err.response.data.message;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Manage Orders</h2>
      </div>

      <DataGrid
        columns={columns}
        data={orders}
        emptyTitle="No Orders Found"
        emptyMessage="As soon as a customer places an order, it will appear here."
      />
    </div>
  );
};

export default AdminOrders;