import { useState, useEffect, type FormEvent } from 'react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { AxiosError } from 'axios';
import { Link } from 'react-router-dom'; // <-- Import Link
import styles from './ProfilePage.module.scss';

// Type to match the data from the API
interface UserProfileData {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  token: string;
}

const ProfilePage = () => {
  const { updateUserContext } = useAuth(); 
  const { showToast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(true);

  // 1. Fetch current profile data on load
  useEffect(() => {
    setLoading(true);
    apiClient.get('/users/profile')
      .then(res => {
        setName(res.data.name || '');
        setEmail(res.data.email || '');
        setPhone(res.data.phone || '');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        showToast('Could not load profile', 'error');
        setLoading(false);
      });
  }, [showToast]);

  // 2. Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.put<UserProfileData>('/users/profile', {
        name,
        email,
        phone,
      });
      
      showToast('Profile updated successfully!', 'success');
      updateUserContext(data);
      setLoading(false);

    } catch (err) {
      console.error(err);
      let message = 'Failed to update profile';
      if (err instanceof AxiosError) message = err.response?.data?.message || message;
      showToast(message, 'error');
      setLoading(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className={styles.container}>
      
      {/* vvv UPDATED HEADER STRUCTURE vvv */}
      <div className={styles.header}>
        <h2>My Profile</h2>
        <Link to="/" className={styles.backLink}>
          &larr; Back to Shop
        </Link>
      </div>
      {/* ^^^ END UPDATED HEADER ^^^ */}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className={styles.formGroup}>
          <label>Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className={styles.formGroup}>
          <label>Phone Number (Optional)</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        
        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;