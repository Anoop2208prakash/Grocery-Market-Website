import { Outlet, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext'; // <-- 1. Import useAuth
import styles from './MainLayout.module.scss';

const MainLayout = () => {
  const { itemCount } = useCart();
  const { user, logout } = useAuth(); // <-- 2. Get user and logout

  return (
    <div>
      <nav className={styles.navbar}>
        <Link to="/" className={styles.navBrand}>
          QuickCart
        </Link>
        <div className={styles.navLinks}>
          {user && ( // <-- 3. Show links if logged in
            <>
              <Link to="/my-orders" className={styles.navLink}>
                My Orders
              </Link>
              {user.role === 'ADMIN' && ( // Link to admin
                 <Link to="/admin" className={styles.navLink}>Admin</Link>
              )}
              <button onClick={logout} className={styles.navButton}>
                Logout
              </button>
            </>
          )}
          {!user && ( // <-- 4. Show login if not
            <Link to="/auth/login" className={styles.navLink}>
              Login
            </Link>
          )}
          <Link to="/cart" className={styles.navLink}>
            Cart
            <span className={styles.cartCount}>{itemCount}</span>
          </Link>
        </div>
      </nav>
      <main style={{ padding: '20px 30px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;