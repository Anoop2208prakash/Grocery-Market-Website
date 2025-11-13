// client/src/services/apiClient.ts
import axios from 'axios';

// Get the API URL from our .env file
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// We can add an interceptor later to automatically add the auth token

export default apiClient;