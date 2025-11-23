import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Add a Request Interceptor to attach the Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Or whatever key you use
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Add a Response Interceptor to handle 401 (Not Authorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or user doesn't exist
      console.error('Session expired or invalid. Logging out...');
      
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo'); 
      
      // Redirect to login (optional, or let the AuthContext handle it)
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;