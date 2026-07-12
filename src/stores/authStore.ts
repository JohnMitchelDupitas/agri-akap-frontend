import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../utils/axios';
import router, { homeForRole } from '../router';

export type UserRole = 'admin' | 'technician' | 'barangay_official';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));
  const token = ref<string | null>(localStorage.getItem('token') || null);

  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role ?? null);
  const userName = computed(() => user.value?.name ?? null);

  /**
   * Called on app init to validate a cached token against the server.
   * Silently clears stale sessions so deactivated users cannot access the app.
   */
  const restoreSession = async () => {
    if (!token.value) return;
    try {
      const res = await apiClient.get('/me');
      // /me returns { data: { user: {...} } }; unwrap to the user object itself
      // (falling back to older shapes) so the role is preserved.
      user.value = res.data.data?.user ?? res.data.data ?? res.data.user;
      localStorage.setItem('user', JSON.stringify(user.value));
    } catch {
      // Token is expired or revoked — force re-login.
      token.value = null;
      user.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const login = async (credentials: { email: string; password: string; device_name: string }) => {
    try {
      const response = await apiClient.post('/login', credentials);
      const data = response.data.data;

      token.value = data.access_token;
      user.value = data.user;
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      router.push(homeForRole(user.value?.role ?? null));

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message ?? 'Login failed.',
      };
    }
  };

  const logout = async () => {
    if (token.value) {
      try {
        await apiClient.post('/logout');
      } catch {
        // ignore
      }
    }
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return { user, token, isAuthenticated, userRole, userName, login, logout, restoreSession };
});
