import { useState, useEffect, type ChangeEvent } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';
import styles from './AdminBanners.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faTrash } from '@fortawesome/free-solid-svg-icons';
import { AxiosError } from 'axios';
import DeleteModal from '../../components/common/DeleteModal'; // <-- 1. Import your existing modal

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
}

const AdminBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  // --- 2. Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchBanners = async () => {
    try {
      const { data } = await apiClient.get('/banners');
      setBanners(data);
    } catch (error) {
      console.error(error);
      showToast('Failed to fetch banners', 'error');
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const { data } = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImageUrl(data.imageUrl);
      showToast('Image uploaded', 'success');
    } catch (err) {
      console.error(err);
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAddBanner = async () => {
    if (!imageUrl) {
      showToast('Please upload an image', 'error');
      return;
    }
    try {
      await apiClient.post('/banners', { title, subtitle, imageUrl });
      showToast('Banner added!', 'success');
      setTitle(''); 
      setSubtitle(''); 
      setImageUrl('');
      fetchBanners();
    } catch (err) {
      console.error(err);
      let message = 'Failed to add banner';
      if (err instanceof AxiosError && err.response?.data?.message) {
        message = err.response.data.message;
      }
      showToast(message, 'error');
    }
  };

  // --- 3. Open Modal Handler ---
  const initiateDelete = (id: string) => {
    setBannerToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // --- 4. Confirm Delete Handler ---
  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;
    
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/banners/${bannerToDelete}`);
      fetchBanners();
      showToast('Banner deleted', 'success');
      setIsDeleteModalOpen(false); // Close modal
    } catch (error) {
      console.error(error);
      showToast('Failed to delete banner', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Banner Manager</h2>
      </div>

      <div className={styles.uploadSection}>
        <h3>Add New Banner</h3>
        
        <div className={styles.bannerUploader}>
          <input 
            id="banner-upload"
            type="file" 
            onChange={handleFileUpload} 
            className={styles.fileInput}
            accept="image/*"
          />
          {imageUrl ? (
            <div className={styles.imagePreview}>
              <img src={`http://localhost:5000${imageUrl}`} alt="Preview" />
              <label htmlFor="banner-upload" className={styles.changeButton}>
                Change Image
              </label>
            </div>
          ) : (
            <label htmlFor="banner-upload" className={styles.uploadBox}>
              <FontAwesomeIcon icon={faCamera} className={styles.icon} />
              <p>Upload Banner Photo</p>
            </label>
          )}
          {uploading && <p style={{ textAlign: 'center', color: '#666' }}>Uploading...</p>}
        </div>

        <div className={styles.formGroup}>
          <input 
            placeholder="Banner Title (e.g., Summer Sale)" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
          />
        </div>
        <div className={styles.formGroup}>
          <input 
            placeholder="Subtitle (e.g., Flat 50% off)" 
            value={subtitle} 
            onChange={e => setSubtitle(e.target.value)} 
          />
        </div>
        
        <button className={styles.addButton} onClick={handleAddBanner} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Add Banner'}
        </button>
      </div>

      <div className={styles.bannerGrid}>
        {banners.map(banner => (
          <div key={banner.id} className={styles.bannerCard}>
            <img src={`http://localhost:5000${banner.imageUrl}`} alt="banner" />
            <div className={styles.overlay}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{banner.title || 'No Title'}</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>{banner.subtitle}</p>
              </div>
              
              <button className={styles.deleteBtn} onClick={() => initiateDelete(banner.id)}>
                <FontAwesomeIcon icon={faTrash} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- 5. Render Your Existing DeleteModal --- */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete Banner?"
        message="Are you sure you want to remove this banner? It will disappear from the homepage immediately."
      />
    </div>
  );
};

export default AdminBanners;