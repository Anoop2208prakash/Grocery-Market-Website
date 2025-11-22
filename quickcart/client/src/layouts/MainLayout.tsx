import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLocation } from '../contexts/LocationContext';
import styles from './MainLayout.module.scss';
import { useState, useEffect, useRef, type FormEvent } from 'react';
import LocationModal from '../components/layout/LocationModal';
import FilterModal from '../components/search/FilterModal'; 
import ProductDetailModal from '../components/products/ProductDetailModal'; // <-- 1. RE-IMPORT THIS

// --- IMPORT FONT AWESOME ---
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faChevronDown,
  faCarrot,
  faAppleWhole,
  faEgg,
  faBreadSlice,
  faFish,
  faGlassWater,
  faCookieBite,
  faWarehouse,
  faFilter
} from '@fortawesome/free-solid-svg-icons';

// --- Data for the Category Bar ---
const categoryNavData = [
  { name: 'Vegetables', icon: <FontAwesomeIcon icon={faCarrot} size="lg" />, link: '/category/Vegetables' },
  { name: 'Fruits', icon: <FontAwesomeIcon icon={faAppleWhole} size="lg" />, link: '/category/Fruits' },
  { name: 'Dairy & Eggs', icon: <FontAwesomeIcon icon={faEgg} size="lg" />, link: '/category/Dairy & Eggs' },
  { name: 'Bakery', icon: <FontAwesomeIcon icon={faBreadSlice} size="lg" />, link: '/category/Bakery' },
  { name: 'Meat & Fish', icon: <FontAwesomeIcon icon={faFish} size="lg" />, link: '/category/Meat & Fish' },
  { name: 'Beverages', icon: <FontAwesomeIcon icon={faGlassWater} size="lg" />, link: '/category/Beverages' },
  { name: 'Snacks', icon: <FontAwesomeIcon icon={faCookieBite} size="lg" />, link: '/category/Snacks' },
  { name: 'Pantry', icon: <FontAwesomeIcon icon={faWarehouse} size="lg" />, link: '/category/Pantry' },
];

const MainLayout = () => {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { 
    locationName, 
    isModalOpen, 
    openModal, 
    closeModal 
  } = useLocation();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/auth/login');
  };
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length === 0) return;
    // Fresh search: go to search page with query
    navigate(`/search?q=${searchQuery}`);
    setSearchQuery('');
  };

  return (
    <div>
      <nav className={styles.navbar}>
        
        {/* Left Section */}
        <div className={styles.brandSection}>
          <Link to="/" className={styles.navBrand}>QuickCart</Link>
          <div 
            className={styles.deliveryInfo} 
            onClick={openModal}
            style={{ cursor: 'pointer' }}
          >
            <h4>Delivery in 10 minutes</h4>
            <span>{locationName} <FontAwesomeIcon icon={faChevronDown} size="xs" /></span>
          </div>
        </div>

        {/* Middle Section (Search + Filter) */}
        <div className={styles.searchWrapper}>
          <form className={styles.searchContainer} onSubmit={handleSearchSubmit}>
            <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder='Search "bread"' 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          
          <button 
            className={styles.filterButton} 
            onClick={() => setIsFilterOpen(true)}
            title="Filter products"
            type="button"
          >
            <FontAwesomeIcon icon={faFilter} />
          </button>
        </div>

        {/* Right Section */}
        <div className={styles.navLinks}>
          {user && (
            <>
              {user.role === 'ADMIN' && (
                 <Link to="/admin" className={styles.navLink}>Admin</Link>
              )}
              
              <div className={styles.profileContainer} ref={dropdownRef}>
                <div 
                  className={styles.profileIcon}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {getInitials(user.name)}
                </div>

                {isDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <Link to="/my-orders" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>My Orders</Link>
                    <Link to="/profile" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>My Profile</Link>
                    <Link to="/profile/update-password" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>Update Password</Link>
                    <button onClick={handleLogout} className={styles.dropdownItembtn}>Logout</button>
                  </div>
                )}
              </div>
            </>
          )}
          {!user && (
            <Link to="/auth/login" className={styles.navLink}>Login</Link>
          )}
          
          <Link to="/cart" className={styles.cartLink}>
            Cart <span className={styles.cartCount}>{itemCount}</span>
          </Link>
        </div>
      </nav>

      {/* Category Bar */}
      <nav className={styles.categoryBar}>
        {categoryNavData.map((item) => (
          <Link to={item.link} key={item.name} className={styles.categoryItem}>
            <div className={styles.iconWrapper}>
              {item.icon}
            </div>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <main style={{ padding: '20px 30px' }}>
        <Outlet />
      </main>

      {/* --- MODALS --- */}
      <LocationModal isOpen={isModalOpen} onClose={closeModal} />
      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
      
      {/* --- 2. ADDED THIS BACK --- */}
      <ProductDetailModal /> 
      
    </div>
  );
};

export default MainLayout;