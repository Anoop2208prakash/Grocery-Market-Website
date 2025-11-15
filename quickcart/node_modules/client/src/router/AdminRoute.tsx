import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading authentication...</div>;
  }

  // 1. Check if user is logged in AND is an Admin
  if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
    // If yes, show the child page (e.g., AdminLayout)
    return <Outlet />;
  }
  
  // 2. If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // 3. If logged in but NOT an Admin (i.e., Customer or Driver)
  //    redirect them to their homepage.
  return <Navigate to="/" replace />;
};

export default AdminRoute;