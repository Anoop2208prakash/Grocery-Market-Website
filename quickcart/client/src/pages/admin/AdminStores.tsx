import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';
import styles from './AdminStores.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faTrash, faMapMarkedAlt } from '@fortawesome/free-solid-svg-icons';
import DeleteModal from '../../components/common/DeleteModal'; // Import Modal

interface DarkStore {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  _count?: { orders: number };
}

const AdminStores = () => {
  const [stores, setStores] = useState<DarkStore[]>([]);
  const [formData, setFormData] = useState({ name: '', address: '', lat: '', lng: '' });
  const { showToast } = useToast();

  // --- Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStores = async () => {
    try {
      const { data } = await apiClient.get('/darkstores');
      setStores(data);
    } catch (err) { 
      console.error(err);
      showToast('Failed to load stores', 'error');
    }
  };

  useEffect(() => { fetchStores(); }, []);

  const handleAdd = async () => {
    if (!formData.name || !formData.lat || !formData.lng) {
      showToast('Please fill all fields', 'error');
      return;
    }
    try {
      await apiClient.post('/darkstores', formData);
      showToast('Dark Store Added!', 'success');
      setFormData({ name: '', address: '', lat: '', lng: '' });
      fetchStores();
    } catch (err) {
      console.error(err);
      showToast('Failed to add store', 'error');
    }
  };

  // --- Open Modal ---
  const initiateDelete = (id: string) => {
    setStoreToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // --- Confirm Delete ---
  const handleConfirmDelete = async () => {
    if (!storeToDelete) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/darkstores/${storeToDelete}`);
      fetchStores();
      showToast('Store removed', 'success');
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FontAwesomeIcon icon={faStore} />
        <h2>Dark Store Manager</h2>
      </div>

      <div className={styles.formCard}>
        <h3>Add New Location</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Store Name</label>
            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., North Zone Hub" />
          </div>
          <div className={styles.formGroup}>
            <label>Address</label>
            <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Street Address" />
          </div>
          <div className={styles.formGroup}>
            <label>Latitude</label>
            <input type="number" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} placeholder="e.g., 26.9124" />
          </div>
          <div className={styles.formGroup}>
            <label>Longitude</label>
            <input type="number" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} placeholder="e.g., 75.7873" />
          </div>
        </div>
        <button className={styles.addButton} onClick={handleAdd}>+ Add Store</button>
      </div>

      <div className={styles.storeList}>
        {stores.map(store => (
          <div key={store.id} className={styles.storeCard}>
            <div>
              <h4>{store.name}</h4>
              <p><FontAwesomeIcon icon={faMapMarkedAlt} /> {store.address}</p>
              <span className={styles.coords}>Lat: {store.lat}, Lng: {store.lng}</span>
            </div>
            <div className={styles.cardActions}>
              <span className={styles.orderCount}>Orders: <span>{store._count?.orders || 0}</span></span>
              <button className={styles.deleteBtn} onClick={() => initiateDelete(store.id)}>
                <FontAwesomeIcon icon={faTrash} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- Modal --- */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete Store?"
        message="Are you sure you want to remove this Dark Store? This could affect order history linked to this location."
      />
    </div>
  );
};

export default AdminStores;