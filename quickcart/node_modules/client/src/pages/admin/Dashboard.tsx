import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import styles from './Dashboard.module.scss';

// --- 1. Define the types we need ---
interface Order {
  totalPrice: number;
}

interface Product {
  totalStock: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // --- 2. Type the API responses here ---
        const [productsRes, ordersRes] = await Promise.all([
          apiClient.get<Product[]>('/products'),
          apiClient.get<Order[]>('/orders')
        ]);

        const products = productsRes.data;
        const orders = ordersRes.data;

        // --- 3. Now TypeScript knows 'order' has 'totalPrice' ---
        const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);
        const totalOrders = orders.length;

        // --- 4. And 'p' has 'totalStock' ---
        const totalProducts = products.length;
        const lowStockCount = products.filter((p) => p.totalStock < 20).length;

        setStats({
          totalOrders,
          totalRevenue,
          totalProducts,
          lowStockCount,
        });
        setLoading(false);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className={styles.dashboard}>
      <h1>Admin Dashboard</h1>
      
      <div className={styles.cardGrid}>
        {/* Revenue Card */}
        <div className={styles.statCard}>
          <h3>Total Revenue</h3>
          <p>₹{stats.totalRevenue.toFixed(2)}</p>
        </div>

        {/* Orders Card */}
        <div className={styles.statCard}>
          <h3>Total Orders</h3>
          <p>{stats.totalOrders}</p>
        </div>

        {/* Products Card */}
        <div className={styles.statCard}>
          <h3>Total Products</h3>
          <p>{stats.totalProducts}</p>
        </div>

        {/* Low Stock Card - Highlight red if high */}
        <div className={styles.statCard} style={stats.lowStockCount > 0 ? { borderLeftColor: '#b91c1c' } : {}}>
          <h3>Low Stock Items</h3>
          <p style={stats.lowStockCount > 0 ? { color: '#b91c1c' } : {}}>
            {stats.lowStockCount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;