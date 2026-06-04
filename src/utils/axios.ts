import axios from 'axios';
import router from '@/router';

// We use import.meta.env to grab the URL from your Vite environment variables
// Fallback to localhost if the environment variable isn't set yet
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
console.log('✅ VITE_API_URL loaded:', import.meta.env.VITE_API_URL);
console.log('✅ Final baseURL being used:', baseURL);
console.log('Axios baseURL:', baseURL); // Add this to verify

const instance = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json' // Laravel needs this to return JSON errors instead of HTML redirects
    }
});

// Request interceptor
instance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        } else {
            // Updated for Laravel: Check for clean endpoints instead of .php files
            const isAuthRoute = config.url?.includes('/login') || config.url?.includes('/register');
            
            if (!isAuthRoute) {
                router.push('/login');
                return Promise.reject(new Error('No authentication token found'));
            }
        }

        return config;
    },
    error => Promise.reject(error)
);

// Response interceptor
instance.interceptors.response.use(
    response => response,
    async error => {
        // If Laravel says the user is unauthorized (401)
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('sellerId'); // Clean up other local storage items if needed
            
            if (router.currentRoute.value.path !== '/login') {
                router.push('/login');
            }
        }
        return Promise.reject(error);
    }
);

export default instance;