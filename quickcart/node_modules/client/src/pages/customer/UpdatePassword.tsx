import { useState, type FormEvent } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { AxiosError } from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from './ProfilePage.module.scss'; // Reusing styles

const UpdatePassword = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      const msg = 'Password cannot be empty';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match';
      setError(msg);
      showToast(msg, 'error');
      return;
    }
    
    setLoading(true);
    try {
      await apiClient.put('/users/profile', {
        password: password,
      });
      
      showToast('Password updated successfully!', 'success');
      setLoading(false);
      setPassword('');
      setConfirmPassword('');
      navigate('/profile'); // Go back to the main profile page

    } catch (err) {
      console.error(err);
      let message = 'Failed to update password';
      if (err instanceof AxiosError) message = err.response?.data?.message || message;
      showToast(message, 'error');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Update Password</h2>
        <Link to="/profile" className={styles.backLink}>
          &larr; Back to Profile
        </Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          {/* --- FIX 1: Add htmlFor --- */}
          <label htmlFor="newPassword">New Password</label>
          <input 
            id="newPassword" // <-- Add id
            type="password" 
            value={password} 
            // --- FIX 2: Change e.Gett to e.target ---
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Enter your new password"
            required 
          />
        </div>
        <div className={styles.formGroup}>
          {/* --- FIX 1: Add htmlFor --- */}
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input 
            id="confirmPassword" // <-- Add id
            type="password" 
            value={confirmPassword} 
            // --- FIX 2: Change e.Gett to e.target ---
            onChange={(e) => setConfirmPassword(e.target.value)} 
            placeholder="Confirm new password"
            required 
          />
        </div>
        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'Saving...' : 'Save New Password'}
        </button>
      </form>
    </div>
  );
};

export default UpdatePassword;