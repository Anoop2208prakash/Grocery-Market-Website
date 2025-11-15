import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // 1. Wait until the auth state is done loading
  if (isLoading) {
    return <div>Loading...</div>; // Or a fancy spinner component
  }

  // 2. If loading is done and there's no user, redirect to login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // 3. (Optional) Check for admin role
  // If we want *only* admins to access this, uncomment this block:
  /*
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />; // Redirect non-admins to home
  }
  */

  // 4. If user is logged in (and has the right role), show the page
  return <Outlet />; // Renders the child route (e.g., AdminLayout)
};

export default ProtectedRoute;