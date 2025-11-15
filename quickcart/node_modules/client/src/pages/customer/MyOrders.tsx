import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid'; // Ensure correct import
import { useAuth } from '../../contexts/AuthContext';
import styles from './MyOrders.module.scss'; // <-- Import SCSS

interface Order {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface OrderRow {
  id: string;
  date: string;
  total: string;
  status: string;
}

const MyOrders = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const columns: ColumnDef<OrderRow>[] = [
    { header: 'Order ID', accessorKey: 'id' },
    { header: 'Date', accessorKey: 'date' },
    { header: 'Total', accessorKey: 'total' },
    { header: 'Status', accessorKey: 'status' },
  ];

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<Order[]>('/orders/myorders');
        
        const formattedData = data.map(order => ({
          id: order.id,
          date: new Date(order.createdAt).toLocaleDateString(),
          total: `₹${order.totalPrice.toFixed(2)}`,
          status: order.status,
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
  }, [user]);

  if (loading) return <div>Loading your orders...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <h2>My Orders</h2>
      <div className={styles.gridWrapper}>
        <DataGrid
          columns={columns}
          data={orders}
          emptyTitle="No Orders Found"
          emptyMessage="You haven't placed any orders yet."
        />
      </div>
    </div>
  );
};

export default MyOrders;