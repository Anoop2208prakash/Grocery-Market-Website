import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import styles from './Dashboard.module.scss';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// --- 1. Define the types we need ---
interface Order {
  totalPrice: number;
}

interface Product {
  totalStock: number;
}

interface StatCardData {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockCount: number;
}

interface ChartData {
  date: string;
  total: number;
}

// --- 2. This is the fix for the 'any' error ---
interface ApiChartData {
  date: string;
  total: string; // The data comes from the server as a string
}

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
// --- End Types ---

const Dashboard = () => {
  const [stats, setStats] = useState<StatCardData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [period, setPeriod] = useState<Period>('monthly'); // Default view
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);

  // 1. Fetch dashboard card data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const [productsRes, ordersRes] = await Promise.all([
          apiClient.get<Product[]>('/products'),
          apiClient.get<Order[]>('/orders'),
        ]);

        const products = productsRes.data;
        const orders = ordersRes.data;

        const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);
        const totalOrders = orders.length;
        const totalProducts = products.length;
        const lowStockCount = products.filter((p) => p.totalStock < 20).length;

        setStats({ totalOrders, totalRevenue, totalProducts, lowStockCount });
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  // 2. Fetch chart data whenever 'period' changes
  useEffect(() => {
    const fetchChartData = async () => {
      setLoadingChart(true);
      try {
        // --- 3. Type the API response ---
        const { data } = await apiClient.get<ApiChartData[]>(`/orders/stats?period=${period}`);
        
        // --- 4. Use the specific type ---
        const formattedData = data.map((item: ApiChartData) => ({
          date: item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
          total: parseFloat(item.total),
        }));
        setChartData(formattedData);
        
      } catch (error) {
        console.error(`Failed to load ${period} stats`, error);
      } finally {
        setLoadingChart(false);
      }
    };
    fetchChartData();
  }, [period]);

  if (loadingStats) return <div>Loading dashboard...</div>;

  return (
    <div className={styles.dashboard}>
      <h1>Admin Dashboard</h1>
      
      {/* --- STAT CARDS --- */}
      <div className={styles.cardGrid}>
        <div className={styles.statCard}>
          <h3>Total Revenue</h3>
          <p>₹{stats?.totalRevenue.toFixed(2) || '0.00'}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Orders</h3>
          <p>{stats?.totalOrders || 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Products</h3>
          <p>{stats?.totalProducts || 0}</p>
        </div>
        <div className={styles.statCard} style={stats && stats.lowStockCount > 0 ? { borderLeftColor: '#b91c1c' } : {}}>
          <h3>Low Stock Items</h3>
          <p style={stats && stats.lowStockCount > 0 ? { color: '#b91c1c' } : {}}>
            {stats?.lowStockCount || 0}
          </p>
        </div>
      </div>

      {/* --- CHART SECTION --- */}
      <div className={styles.toggleButtons}>
        <button 
          className={`${styles.toggleButton} ${period === 'daily' ? styles.active : ''}`}
          onClick={() => setPeriod('daily')}
        >
          Daily (7d)
        </button>
        <button 
          className={`${styles.toggleButton} ${period === 'weekly' ? styles.active : ''}`}
          onClick={() => setPeriod('weekly')}
        >
          Weekly (12w)
        </button>
        <button 
          className={`${styles.toggleButton} ${period === 'monthly' ? styles.active : ''}`}
          onClick={() => setPeriod('monthly')}
        >
          Monthly (12m)
        </button>
        <button 
          className={`${styles.toggleButton} ${period === 'yearly' ? styles.active : ''}`}
          onClick={() => setPeriod('yearly')}
        >
          Yearly (5y)
        </button>
      </div>

      <div className={styles.chartContainer}>
        {loadingChart ? <p>Loading chart data...</p> : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(value) => `₹${value}`} />
              <Tooltip formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']} />
              <Line type="monotone" dataKey="total" stroke="#31694E" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Dashboard;