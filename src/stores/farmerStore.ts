import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../utils/axios';

// --- TypeScript Interfaces ---
export interface FarmPlot {
  id?: string;
  location_brgy: string;
  total_parcel_area_ha: number;
  commodity: string;
  // ... other plot fields
}

export interface Farmer {
  id: string;
  rsbsa_no: string | null;
  first_name: string;
  surname: string;
  farm_plots_count?: number; // Comes from Laravel's withCount()
  plots?: FarmPlot[];
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
}

export const useFarmerStore = defineStore('farmer', () => {
  // --- State ---
  const farmers = ref<Farmer[]>([]);
  const pagination = ref<PaginationMeta | null>(null);
  
  // UI States
  const isLoading = ref<boolean>(false);
  const isEnrolling = ref<boolean>(false);
  const error = ref<string | null>(null);

  // --- Actions ---

  /**
   * Fetch paginated list of farmers. 
   * Supports optional search queries.
   */
  const fetchFarmers = async (page: number = 1, searchQuery: string = '') => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get('/farmers', {
        params: { 
          page: page,
          search: searchQuery 
        }
      });

      // Laravel paginate() wraps data in 'data' and pagination details at the root
      const payload = response.data.data; 
      
      // Update state
      farmers.value = payload.data; // The actual array of farmers
      pagination.value = {
        current_page: payload.current_page,
        last_page: payload.last_page,
        total: payload.total
      };

    } catch (err: any) {
      console.error('Failed to fetch farmers:', err);
      error.value = err.response?.data?.message || 'Failed to load registry. Please check your connection.';
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Submit the complex nested RSBSA form to the backend.
   */
  const enrollFarmer = async (farmerPayload: any) => {
    isEnrolling.value = true;
    error.value = null;

    try {
      const response = await apiClient.post('/farmers', farmerPayload);
      
      // Optionally, push the new farmer directly into the local state
      // to avoid needing an immediate re-fetch from the server
      if (response.data.status === 'success') {
        farmers.value.unshift(response.data.data);
      }
      
      return { success: true };
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Enrollment failed.';
      return { 
        success: false, 
        errors: err.response?.data?.errors // Laravel validation errors
      };
    } finally {
      isEnrolling.value = false;
    }
  };

  return { 
    farmers, 
    pagination, 
    isLoading, 
    isEnrolling, 
    error, 
    fetchFarmers, 
    enrollFarmer 
  };
});