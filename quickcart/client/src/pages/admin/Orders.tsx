import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios';
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid';

// --- THIS IS THE FIX ---
// We define a minimal type for the items array.
interface OrderItem {
  product: {
    name: string;
  };
  // We could add quantity, price, etc. here if needed
}
// --- END FIX ---

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
  items: OrderItem[]; // <-- Use the OrderItem type instead of any[]
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

  // Define our columns
  const columns: ColumnDef<OrderRow>[] = [
    { header: 'Order ID', accessorKey: 'id' },
    { header: 'Customer', accessorKey: 'customer' },
    { header: 'Total', accessorKey: 'total' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Date', accessorKey: 'date' },
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<Order[]>('/orders');
        
        // Transform data for the grid
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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