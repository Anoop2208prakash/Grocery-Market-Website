import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext'; // <-- 1. Import Toast
import { AxiosError } from 'axios';
import styles from './Auth.module.scss';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast(); // <-- 2. Get showToast hook
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Perform login
      const user = await login(email, password);
      setLoading(false);

      // 3. Show Success Toast
      showToast(`Welcome back, ${user.name}!`, 'success');

      // 4. Role-based Redirect Logic
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else if (user.role === 'DRIVER') {
        navigate('/driver');
      } else if (user.role === 'PACKER') {
        navigate('/packer'); // <--- Redirect Packer to their dashboard
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      let message = 'Login failed';
      if (err instanceof AxiosError && err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      
      // 5. Show Error Toast
      showToast(message, 'error');
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <h1 className={styles.title}>Login to QuickCart</h1>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className={styles.footerText}>
          Don't have an account? 
          <Link to="/auth/register">Register here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;