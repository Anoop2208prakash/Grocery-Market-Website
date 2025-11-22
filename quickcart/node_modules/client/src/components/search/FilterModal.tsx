import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Modal from '../common/Modal';
import apiClient from '../../services/apiClient';
import styles from './FilterModal.module.scss';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Category {
  id: string;
  name: string;
}

const FilterModal = ({ isOpen, onClose }: FilterModalProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Local state for filters
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'newest');

  // Fetch categories once
  useEffect(() => {
    apiClient.get('/categories').then(res => setCategories(res.data));
  }, []);

  // Sync with URL when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(searchParams.get('categoryId') || '');
      setMinPrice(searchParams.get('minPrice') || '');
      setMaxPrice(searchParams.get('maxPrice') || '');
      setSortOrder(searchParams.get('sort') || 'newest');
    }
  }, [isOpen, searchParams]);

  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    
    if (selectedCategory) params.set('categoryId', selectedCategory);
    else params.delete('categoryId');

    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');

    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');

    if (sortOrder) params.set('sort', sortOrder);
    
    // If we are not on the search page, go there. Otherwise just update params.
    navigate(`/search?${params.toString()}`);
    onClose();
  };

  const handleReset = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortOrder('newest');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.container}>
        <h2 className={styles.title}>Filter & Sort</h2>
        
        <div className={styles.group}>
          <label>Category</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.group}>
          <label>Price Range (₹)</label>
          <div className={styles.row}>
            <input 
              type="number" 
              placeholder="Min" 
              value={minPrice} 
              onChange={(e) => setMinPrice(e.target.value)} 
            />
            <span>-</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={maxPrice} 
              onChange={(e) => setMaxPrice(e.target.value)} 
            />
          </div>
        </div>

        <div className={styles.group}>
          <label>Sort By</label>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        <div className={styles.actions}>
          <button className={styles.resetBtn} onClick={handleReset}>Reset</button>
          <button className={styles.applyBtn} onClick={handleApply}>Apply Filters</button>
        </div>
      </div>
    </Modal>
  );
};

export default FilterModal;