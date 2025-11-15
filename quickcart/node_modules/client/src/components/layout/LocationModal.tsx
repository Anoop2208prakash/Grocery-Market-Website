import { useState, type KeyboardEvent, useRef } from 'react';
import Modal from '../common/Modal';
import styles from './LocationModal.module.scss';
import { useLocation } from '../../contexts/LocationContext';
import apiClient from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';

// ... (SVG Icons: DetectIcon, SearchIcon remain the same) ...
const DetectIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="1" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="23"></line><line x1="1" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="23" y2="12"></line>
  </svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  name: string;
}

const LocationModal = ({ isOpen, onClose }: LocationModalProps) => {
  const { isLoading, detectLocation, setLocationName } = useLocation();
  const { showToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  
  const searchTimerRef = useRef<number | null>(null);

  // --- 1. THIS IS THE CORE API CALL ---
  const performSearch = async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    try {
      const { data } = await apiClient.get(`/location/search?q=${query}`);
      setResults(data);
      if (data.length === 0) {
        showToast('No matching locations found', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to search location', 'error');
    }
  };

  // --- 2. THIS HANDLES TYPING (DEBOUNCED) ---
  const handleSearchOnChange = (query: string) => {
    setSearchQuery(query);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = window.setTimeout(() => {
      performSearch(query);
    }, 300); // 300ms delay
  };

  // --- 3. THIS HANDLES "ENTER" (IMMEDIATE) ---
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Cancel any pending debounced search
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      
      // Perform the search immediately
      performSearch(searchQuery);
    }
  };
  
  // This function is for clicking a result
  const handleSelectLocation = (name: string) => {
    setLocationName(name);
    showToast('Location updated!', 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.container}>
        <h3 className={styles.title}>Change Location</h3>
        <div className={styles.body}>
          <button 
            className={styles.detectButton} 
            onClick={detectLocation}
            disabled={isLoading}
          >
            {isLoading ? 'Detecting...' : <><DetectIcon /> Detect my location</>}
          </button>
          <div className={styles.separator}>OR</div>
          <div className={styles.searchContainer}>
            <div className={styles.searchIcon}><SearchIcon /></div>
            <input 
              type="text" 
              placeholder="Search delivery location"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => handleSearchOnChange(e.target.value)} // <-- Use debounced handler
              onKeyDown={handleKeyDown} // <-- Use "Enter" handler
            />
          </div>
        </div>

        <div className={styles.resultsList}>
          {results.map(result => (
            <div 
              key={result.id}
              className={styles.resultItem}
              onClick={() => handleSelectLocation(result.name)}
            >
              {result.name}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default LocationModal;