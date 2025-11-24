import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';
import styles from './AdminCoupons.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicketAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { AxiosError } from 'axios';
import DeleteModal from '../../components/common/DeleteModal'; // <-- Import DeleteModal

interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: 'PERCENTAGE' | 'FIXED';
  minOrder: number;
  expiry: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    type: 'PERCENTAGE',
    minOrder: '',
    expiry: ''
  });
  const { showToast } = useToast();

  // --- Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCoupons = async () => {
    try {
      const { data } = await apiClient.get('/coupons'); 
      setCoupons(data);
    } catch (err) { 
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);
  
  const handleCreate = async () => {
    if (!formData.code || !formData.discount || !formData.expiry) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      await apiClient.post('/coupons', {
        ...formData,
        discount: parseFloat(formData.discount),
        minOrder: parseFloat(formData.minOrder) || 0,
      });
      showToast('Coupon created successfully!', 'success');
      setFormData({ code: '', discount: '', type: 'PERCENTAGE', minOrder: '', expiry: '' });
      fetchCoupons();
    } catch (err) {
      console.error(err);
      let message = 'Failed to create coupon';
      if (err instanceof AxiosError && err.response?.data?.message) {
        message = err.response.data.message;
      }
      showToast(message, 'error');
    }
  };

  // --- Delete Handlers ---
  const initiateDelete = (id: string) => {
    setCouponToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!couponToDelete) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/coupons/${couponToDelete}`); // Ensure you have this route in backend!
      fetchCoupons();
      showToast('Coupon deleted', 'success');
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete coupon', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2><FontAwesomeIcon icon={faTicketAlt} /> Coupon Manager</h2>
      </div>

      <div className={styles.formCard}>
        <h3>Create New Coupon</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Coupon Code</label>
            <input 
              placeholder="e.g. WELCOME50" 
              value={formData.code} 
              onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Discount Type</label>
            <select 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (₹)</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Discount Value</label>
            <input 
              type="number" 
              placeholder="e.g. 20" 
              value={formData.discount} 
              onChange={e => setFormData({...formData, discount: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Min Order Amount</label>
            <input 
              type="number" 
              placeholder="e.g. 500" 
              value={formData.minOrder} 
              onChange={e => setFormData({...formData, minOrder: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Expiry Date</label>
            <input 
              type="date" 
              value={formData.expiry} 
              onChange={e => setFormData({...formData, expiry: e.target.value})}
            />
          </div>
        </div>
        <button className={styles.createButton} onClick={handleCreate}>Create Coupon</button>
      </div>

      <div className={styles.couponList}>
        {coupons.length === 0 ? (
            <p style={{gridColumn: '1 / -1', textAlign: 'center', color: '#888'}}>No active coupons.</p>
        ) : (
            coupons.map(coupon => (
                <div key={coupon.id} className={styles.couponCard}>
                  <div className={styles.code}>{coupon.code}</div>
                  <div className={styles.discount}>
                    {coupon.type === 'PERCENTAGE' ? `${coupon.discount}% OFF` : `₹${coupon.discount} OFF`}
                  </div>
                  <div className={styles.meta}>Min Order: <span>₹{coupon.minOrder}</span></div>
                  <div className={styles.meta}>Expires: <span>{new Date(coupon.expiry).toLocaleDateString()}</span></div>
                  
                  <button className={styles.deleteBtn} onClick={() => initiateDelete(coupon.id)}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
            ))
        )}
      </div>

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete Coupon?"
        message="Are you sure you want to remove this coupon? Users will no longer be able to use it."
      />
    </div>
  );
};

export default AdminCoupons;