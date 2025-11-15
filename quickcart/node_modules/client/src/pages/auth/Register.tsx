import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext'; // <-- 1. Import useToast
import { AxiosError } from 'axios';
import styles from './Auth.module.scss';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // We can remove local 'error' state since we use toasts now, 
  // but keeping it for inline display is also fine if you want both.
  const [error, setError] = useState(''); 
  
  const { showToast } = useToast(); // <-- 2. Get the hook
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !email || !password) {
      const msg = 'Please fill in all fields';
      setError(msg);
      showToast(msg, 'error'); // <-- 3. Show validation toast
      setLoading(false);
      return;
    }

    try {
      const { data } = await apiClient.post('/auth/register', {
        name,
        email,
        password,
      });

      console.log('Registration successful:', data);
      setLoading(false);
      
      // 4. Show Success Toast
      showToast('Registration successful! Please login.', 'success');
      
      navigate('/auth/login');
    } catch (err) {
      console.error(err);
      let message = 'Registration failed';
      if (err instanceof AxiosError && err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      
      setError(message);
      showToast(message, 'error'); // <-- 5. Show Error Toast
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <h1 className={styles.title}>Create Account</h1>
      
      <form onSubmit={handleSubmit}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.formGroup}>
          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>

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
            placeholder="Create a strong password"
            required
          />
        </div>

        <button 
          type="submit" 
          className={styles.submitButton} 
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>

        <p className={styles.footerText}>
          Already have an account? 
          <Link to="/auth/login">Login here</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;