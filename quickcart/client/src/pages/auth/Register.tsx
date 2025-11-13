// client/src/pages/auth/Register.tsx
import { useState, type FormEvent} from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { AxiosError } from 'axios'; // <-- 1. IMPORT THIS

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !email || !password) {
      setError('Please fill in all fields');
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
      navigate('/auth/login'); 

    // vvv 2. REPLACE THIS WHOLE BLOCK vvv
    } catch (err) { 
      console.error(err);
      let message = 'Registration failed'; // Default message

      if (err instanceof AxiosError) {
        if (err.response?.data?.message) {
          message = err.response.data.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
      setLoading(false);
    }
    // ^^^ 2. REPLACE THIS WHOLE BLOCK ^^^
  };

  // ... rest of the component ...
  return (
    <div style={{ maxWidth: 400, margin: '50px auto' }}>
      <h1>Register for QuickCart</h1>
      <form onSubmit={handleSubmit}>
        {/* ... form inputs ... */}
        <div style={{ marginBottom: 10 }}>
          <label>Name</label><br />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Email</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Password</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Register;