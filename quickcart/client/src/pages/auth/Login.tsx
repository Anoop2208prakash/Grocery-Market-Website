// client/src/pages/auth/Login.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AxiosError } from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // --- THIS IS THE UPDATED BLOCK ---

      // 1. Capture the user data returned from login
      const user = await login(email, password);

      setLoading(false);

      // 2. Check the user's role and redirect
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        navigate('/admin'); // Admins go to the dashboard
      } else {
        navigate('/'); // Customers go to the homepage
      }

      // --- END UPDATED BLOCK ---
      
    } catch (err) {
      console.error(err);
      let message = 'Login failed'; // Default message

      if (err instanceof AxiosError) {
        // Now we know it's an Axios error, so we can safely access response
        if (err.response?.data?.message) {
          message = err.response.data.message;
        }
      } else if (err instanceof Error) {
        // It's some other kind of error
        message = err.message;
      }

      setError(message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto' }}>
      <h1>Login to QuickCart</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>Email</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p>
          Don't have an account? <Link to="/auth/register">Register here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;