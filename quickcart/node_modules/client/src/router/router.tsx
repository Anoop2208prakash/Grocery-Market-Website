import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// --- Import Layouts ---
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';

// --- Import Protectors ---
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

// --- Import Page components ---
// Customer Pages
import Home from '../pages/customer/Home';
import CartPage from '../pages/customer/CartPage';
import OrderSuccess from '../pages/customer/OrderSuccess';
import MyOrders from '../pages/customer/MyOrders';
import ProfilePage from '../pages/customer/ProfilePage';
import UpdatePassword from '../pages/customer/UpdatePassword';
import SearchPage from '../pages/customer/SearchPage';
import CategoryPage from '../pages/customer/CategoryPage';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Admin Pages
import Dashboard from '../pages/admin/Dashboard';
import AdminInventory from '../pages/admin/Inventory';
import ProductCreate from '../pages/admin/ProductCreate';
import ProductEdit from '../pages/admin/ProductEdit';
import AdminOrders from '../pages/admin/Orders';
import AdminOrderDetails from '../pages/admin/OrderDetails';

// Driver Page
import DriverDashboard from '../pages/driver/DriverDashboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'order-success/:id', element: <OrderSuccess /> },
      { path: 'my-orders', element: <MyOrders /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profile/update-password', element: <UpdatePassword /> },
      { path: 'search', element: <SearchPage /> },
      // --- vvv THIS IS THE CHANGE vvv ---
      { path: 'category/:name', element: <CategoryPage /> }, 
    ],
  },
  {
    path: '/auth',
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
    ],
  },
  {
    element: <ProtectedRoute />, // <-- Guards all children (Driver + Admin)
    children: [
      { 
        path: '/driver', 
        element: <DriverDashboard /> 
      },
      {
        element: <AdminRoute />, // <-- Guards only Admin routes
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <Dashboard /> },
              { path: 'orders', element: <AdminOrders /> },
              { path: 'orders/:id', element: <AdminOrderDetails /> },
              { path: 'inventory', element: <AdminInventory /> },
              { path: 'inventory/new', element: <ProductCreate /> },
              { path: 'inventory/edit/:id', element: <ProductEdit /> },
            ],
          },
        ]
      },
    ],
  },
]);

/**
 * Main application router provider component.
 */
export const AppRouter = () => {
  return <RouterProvider router={router} />;
};