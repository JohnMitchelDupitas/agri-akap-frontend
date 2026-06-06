import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const apiClient = axios.create({
  // Point this to your Laravel backend URL (e.g., http://localhost:8000/api)
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token && config.headers) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  return config;
});

// Response Interceptor: Handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      authStore.logout(); // Clear state and redirect to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;