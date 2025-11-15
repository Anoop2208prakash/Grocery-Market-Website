import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useToast } from './ToastContext';
import apiClient from '../services/apiClient';
import { AxiosError } from 'axios';

interface LocationContextType {
  locationName: string;
  isModalOpen: boolean;
  isLoading: boolean;
  openModal: () => void;
  closeModal: () => void;
  detectLocation: () => void;
  setLocationName: (name: string) => void; // <-- 1. ADD THIS TO THE TYPE
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [locationName, setLocationName] = useState('Jaipur, Rajasthan, India');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    
    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const { data } = await apiClient.post('/location/check', {
            lat: latitude,
            lon: longitude,
          });

          setLocationName(data.locationName);
          showToast('Location updated!', 'success');
          closeModal();

        } catch (err) {
          console.error(err);
          let message = 'Failed to set location';
          if (err instanceof AxiosError) {
            message = err.response?.data?.message || message;
          } else if (err instanceof Error) {
            message = err.message;
          }
          showToast(message, 'error');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        let message = 'Failed to get location';
        if (err.code === 1) {
          message = 'You denied location access.';
        }
        showToast(message, 'error');
        setIsLoading(false);
      }
    );
  }, [showToast]);

  return (
    <LocationContext.Provider 
      value={{ 
        locationName, 
        isModalOpen, 
        isLoading, 
        openModal, 
        closeModal, 
        detectLocation,
        setLocationName, // <-- 2. ADD THE FUNCTION TO THE VALUE
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};