import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../utils/axios';
import router from '../router';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician';
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));
  const token = ref<string | null>(localStorage.getItem('token') || null);

  // Getters
  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role || null);

  // Actions
  const login = async (credentials: { email: string; password: string; device_name: string }) => {
    try {
      const response = await apiClient.post('/login', credentials);
      const data = response.data.data;

      // Update State
      token.value = data.access_token;
      user.value = data.user;

      // Persist for offline/reloads
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Route based on RBAC
      if (user.value?.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/technician-home');
      }
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed.' 
      };
    }
  };

  const logout = async () => {
    if (token.value) {
      try {
        await apiClient.post('/logout');
      } catch (e) {
        // Ignore errors on logout (e.g., if offline)
      }
    }
    
    // Clear State & Storage
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    router.push('/login');
  };

  return { user, token, isAuthenticated, userRole, login, logout };
});