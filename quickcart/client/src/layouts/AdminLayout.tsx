import { Outlet, Link, useNavigate } from 'react-router-dom';
import styles from './AdminLayout.module.scss';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const AdminLayout = () => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/auth/login');
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <Link to="/admin" className={styles.brand}>
          QuickCart Admin
        </Link>
        
        <nav>
          <ul>
            <li>
              <Link to="/admin">Dashboard</Link>
            </li>
            <li>
              <Link to="/admin/orders">Orders</Link>
            </li>
            <li>
              <Link to="/admin/inventory">Inventory</Link>
            </li>
            <li>
              <Link to="/admin/banners">Banners</Link>
            </li>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/admin/stores">Stores</Link>
            </li>
            <li>
              <Link to="/admin/coupons">Coupons</Link>
            </li>
          </ul>
        </nav>

        {/* --- ADDED LOGOUT BUTTON --- */}
        {/* It goes after <nav> so flex-grow pushes it to the bottom */}
        <button 
          className={styles.logoutButton} 
          onClick={handleLogout}
        >
          Logout
        </button>
        {/* --- END ADDED BUTTON --- */}

        <div className={styles.footer}>
          &copy; 2025 QuickCart
        </div>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;