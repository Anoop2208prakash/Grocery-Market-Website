import axios from 'axios';

// Create Axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Ensure this matches your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- 1. Request Interceptor: Attach Token ---
apiClient.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage
    // Check if your AuthContext saves it as 'token' or 'userToken'
    const token = localStorage.getItem('token'); 
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- 2. Response Interceptor: Handle Auth Errors ---
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout if we get a 401 (Unauthorized) from the server
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized access - logging out...');
      
      // Optional: Clear storage and redirect ONLY if it's a generic auth error
      // (You might want to disable this while debugging)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;