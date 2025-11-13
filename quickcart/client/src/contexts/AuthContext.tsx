import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../services/apiClient';

// Define the shape of the User object
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

// Define the shape of the Context
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>; // <-- 1. THIS LINE IS CHANGED
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Effect to load user data on app start
  useEffect(() => {
    const loadUserFromToken = async () => {
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch (err) {
          console.error("Failed to load user", err);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };
    loadUserFromToken();
  }, [token]);

  // Login function
  const login = async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password });

    // Save data
    setToken(data.token);
    setUser(data);

    // Set token for future requests
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

    // Persist to localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));

    return data; // <-- 2. THIS LINE IS ADDED
  };

  // Logout function
  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);

    // Clear from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Remove from apiClient headers
    delete apiClient.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// Create the custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};