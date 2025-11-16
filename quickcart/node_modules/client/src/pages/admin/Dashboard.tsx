import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import styles from './Dashboard.module.scss';
import {
  LineChart, Line, BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// --- Types for our data ---
interface Order { totalPrice: number; }
interface Product { totalStock: number; }
interface StatCardData { totalOrders: number; totalRevenue: number; totalProducts: number; lowStockCount: number; }

// Chart Data Types
interface ChartData { date: string; total: number; }
interface ApiChartData { date: string; total: string; }
interface CategoryChartData { name: string; count: number; }
interface LowStockItem { id: string; quantity: number; product: { name: string; sku: string; } }
type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
// --- End Types ---

// A simple list component for low stock
const LowStockList = ({ items }: { items: LowStockItem[] }) => (
  <div className={styles.lowStockList}>
    {items.length === 0 ? (
      <p className={styles.emptyMessage}>No low stock items. Good job!</p>
    ) : (
      items.map(item => (
        <div key={item.id} className={styles.lowStockItem}>
          <strong>{item.product.name}</strong>
          <span>SKU: {item.product.sku}</span>
          <span className={styles.lowStockQuantity}>{item.quantity} left</span>
        </div>
      ))
    )}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<StatCardData | null>(null);
  
  // --- State for all 4 toggles ---
  const [showRevenueChart, setShowRevenueChart] = useState(false);
  const [showOrdersChart, setShowOrdersChart] = useState(false);
  const [showProductChart, setShowProductChart] = useState(false);
  const [showLowStockList, setShowLowStockList] = useState(false);

  // --- State for chart data ---
  const [revenueChartData, setRevenueChartData] = useState<ChartData[]>([]);
  const [ordersChartData, setOrdersChartData] = useState<ChartData[]>([]);
  const [productChartData, setProductChartData] = useState<CategoryChartData[]>([]);
  const [lowStockListData, setLowStockListData] = useState<LowStockItem[]>([]);
  
  const [revenuePeriod, setRevenuePeriod] = useState<Period>('monthly');
  const [ordersPeriod, setOrdersPeriod] = useState<Period>('monthly');
  
  const [loading, setLoading] = useState(true);

  // 1. Fetch stat card data (runs once)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          apiClient.get<Product[]>('/products'),
          apiClient.get<Order[]>('/orders'),
        ]);
        const products = productsRes.data;
        const orders = ordersRes.data;
        setStats({
          totalRevenue: orders.reduce((acc, order) => acc + order.totalPrice, 0),
          totalOrders: orders.length,
          totalProducts: products.length,
          lowStockCount: products.filter((p) => p.totalStock < 20).length,
        });
      } catch (error) { console.error("Failed to load dashboard stats", error); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  // 2. Fetch REVENUE chart data
  useEffect(() => {
    if (!showRevenueChart) return;
    const fetchChartData = async () => {
      const { data } = await apiClient.get<ApiChartData[]>(`/orders/stats?period=${revenuePeriod}`);
      setRevenueChartData(data.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: parseFloat(item.total),
      })));
    };
    fetchChartData();
  }, [revenuePeriod, showRevenueChart]);

  // 3. Fetch ORDERS chart data
  useEffect(() => {
    if (!showOrdersChart) return;
    const fetchChartData = async () => {
      const { data } = await apiClient.get<ApiChartData[]>(`/orders/stats/count?period=${ordersPeriod}`);
      setOrdersChartData(data.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: parseInt(item.total, 10),
      })));
    };
    fetchChartData();
  }, [ordersPeriod, showOrdersChart]);
  
  // 4. Fetch PRODUCTS chart data
  useEffect(() => {
    if (!showProductChart) return;
    const fetchChartData = async () => {
      const { data } = await apiClient.get<CategoryChartData[]>(`/products/stats/category`);
      setProductChartData(data);
    };
    fetchChartData();
  }, [showProductChart]);

  // 5. Fetch LOW STOCK list data
  useEffect(() => {
    if (!showLowStockList) return;
    const fetchListData = async () => {
      const { data } = await apiClient.get<LowStockItem[]>(`/products/stats/lowstock`);
      setLowStockListData(data);
    };
    fetchListData();
  }, [showLowStockList]);
  
  // Helper to close all other charts
  const toggleChart = (chart: 'revenue' | 'orders' | 'products' | 'stock') => {
    setShowRevenueChart(chart === 'revenue' ? !showRevenueChart : false);
    setShowOrdersChart(chart === 'orders' ? !showOrdersChart : false);
    setShowProductChart(chart === 'products' ? !showProductChart : false);
    setShowLowStockList(chart === 'stock' ? !showLowStockList : false);
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className={styles.dashboard}>
      <h1>Admin Dashboard</h1>
      
      <div className={styles.cardGrid}>
        <div className={`${styles.statCard} ${styles.clickable}`} onClick={() => toggleChart('revenue')}>
          <h3>Total Revenue</h3>
          <p>₹{stats?.totalRevenue.toFixed(2) || '0.00'}</p>
        </div>
        <div className={`${styles.statCard} ${styles.clickable}`} onClick={() => toggleChart('orders')}>
          <h3>Total Orders</h3>
          <p>{stats?.totalOrders || 0}</p>
        </div>
        <div className={`${styles.statCard} ${styles.clickable}`} onClick={() => toggleChart('products')}>
          <h3>Total Products</h3>
          <p>{stats?.totalProducts || 0}</p>
        </div>
        <div 
          className={`${styles.statCard} ${styles.clickable}`} 
          style={stats && stats.lowStockCount > 0 ? { borderLeftColor: '#b91c1c' } : {}}
          onClick={() => toggleChart('stock')}
        >
          <h3 style={stats && stats.lowStockCount > 0 ? { color: '#b91c1c' } : {}}>Low Stock Items</h3>
          <p style={stats && stats.lowStockCount > 0 ? { color: '#b91c1c' } : {}}>{stats?.lowStockCount || 0}</p>
        </div>
      </div>

      {/* --- REVENUE CHART --- */}
      {showRevenueChart && (
        <div className={styles.chartSection}>
          <div className={styles.toggleButtons}>
            <button className={`${styles.toggleButton} ${revenuePeriod === 'daily' ? styles.active : ''}`} onClick={() => setRevenuePeriod('daily')}>Daily (7d)</button>
            <button className={`${styles.toggleButton} ${revenuePeriod === 'weekly' ? styles.active : ''}`} onClick={() => setRevenuePeriod('weekly')}>Weekly (12w)</button>
            <button className={`${styles.toggleButton} ${revenuePeriod === 'monthly' ? styles.active : ''}`} onClick={() => setRevenuePeriod('monthly')}>Monthly (12m)</button>
            <button className={`${styles.toggleButton} ${revenuePeriod === 'yearly' ? styles.active : ''}`} onClick={() => setRevenuePeriod('yearly')}>Yearly (5y)</button>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#31694E" stopOpacity={0.8}/><stop offset="95%" stopColor="#31694E" stopOpacity={0.1}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(value) => `₹${value}`} />
                <Tooltip formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']} />
                <Area type="monotone" dataKey="total" stroke="#31694E" strokeWidth={3} dot={false} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* --- ORDERS CHART --- */}
      {showOrdersChart && (
        <div className={styles.chartSection}>
          <h3>New Orders</h3>
          <div className={styles.toggleButtons}>
            <button className={`${styles.toggleButton} ${ordersPeriod === 'daily' ? styles.active : ''}`} onClick={() => setOrdersPeriod('daily')}>Daily (7d)</button>
            <button className={`${styles.toggleButton} ${ordersPeriod === 'weekly' ? styles.active : ''}`} onClick={() => setOrdersPeriod('weekly')}>Weekly (12w)</button>
            <button className={`${styles.toggleButton} ${ordersPeriod === 'monthly' ? styles.active : ''}`} onClick={() => setOrdersPeriod('monthly')}>Monthly (12m)</button>
            <button className={`${styles.toggleButton} ${ordersPeriod === 'yearly' ? styles.active : ''}`} onClick={() => setOrdersPeriod('yearly')}>Yearly (5y)</button>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ordersChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip formatter={(value: number) => [`${value}`, 'New Orders']} />
                <Line type="monotone" dataKey="total" stroke="#BBC863" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* --- PRODUCTS CHART --- */}
      {showProductChart && (
        <div className={styles.chartSection}>
          <h3>Products per Category</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value: number) => [`${value}`, 'Products']} />
                <Bar dataKey="count" fill="#658C58" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* --- LOW STOCK LIST --- */}
      {showLowStockList && (
        <div className={styles.chartSection}>
          <h3>Low Stock Items (20 or less)</h3>
          <LowStockList items={lowStockListData} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;