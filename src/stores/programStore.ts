import { defineStore } from 'pinia';
import { ref } from 'vue';
import axiosInstance from '../utils/axios';

interface Program {
  id: string;
  name: string;
  description: string;
  type: 'seeds' | 'fertilizer' | 'cash' | 'equipment';
  is_active: boolean;
  start_date: string;
  end_date: string;
}

export const useProgramStore = defineStore('program', () => {
  const programs = ref<Program[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchPrograms = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await axiosInstance.get('/programs');
      // Handle paginated response from Laravel
      const data = response.data.data;
      programs.value = Array.isArray(data) ? data : (data?.data || []);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch programs';
      console.error('Program fetch error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // Get only active programs
  const activePrograms = () => {
    return programs.value.filter(p => p.is_active);
  };

  return { programs, isLoading, error, fetchPrograms, activePrograms };
});
