<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>MAO Analytics Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding auth-bg">
      <div class="dashboard-wrapper">
        
        <div class="header-section">
          <h2>Accomplishment Overview</h2>
          <p class="text-muted">Real-time distribution analytics and audit trails.</p>
        </div>

        <div v-if="isLoading" class="loading-state">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Compiling reports...</p>
        </div>

        <div v-else-if="stats">
          
          <ion-grid class="ion-no-padding mb-4">
            <ion-row>
              <ion-col size="12" size-md="6" size-lg="3">
                <ion-card class="kpi-card">
                  <ion-card-content>
                    <div class="kpi-icon bg-green-light">
                      <ion-icon :icon="layersOutline"></ion-icon>
                    </div>
                    <div class="kpi-data">
                      <h3>{{ stats.metrics.active_programs }}</h3>
                      <p>Active Programs</p>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <ion-col size="12" size-md="6" size-lg="3">
                <ion-card class="kpi-card">
                  <ion-card-content>
                    <div class="kpi-icon bg-blue-light">
                      <ion-icon :icon="peopleOutline"></ion-icon>
                    </div>
                    <div class="kpi-data">
                      <h3>{{ stats.metrics.total_farmers.toLocaleString() }}</h3>
                      <p>Registered Farmers</p>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <ion-col 
                size="12" size-md="6" size-lg="3" 
                v-for="(item, index) in stats.metrics.dispensed_breakdown" 
                :key="index"
              >
                <ion-card class="kpi-card highlight-card">
                  <ion-card-content>
                    <div class="kpi-icon bg-gold-light">
                      <ion-icon :icon="leafOutline"></ion-icon>
                    </div>
                    <div class="kpi-data">
                      <h3>{{ Number(item.total_dispensed).toLocaleString() }}</h3>
                      <p>Total Dispensed ({{ item.unit }})</p>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>

          <div class="table-card">
            <div class="table-header">
              <h3>Recent Transactions (Audit Trail)</h3>
              <ion-button fill="clear" size="small" @click="fetchStats">
                <ion-icon :icon="refreshOutline" slot="start"></ion-icon> Refresh
              </ion-button>
            </div>
            
            <div class="table-responsive">
              <table class="mao-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Farmer Name</th>
                    <th>Program</th>
                    <th>Dispensed</th>
                    <th>Technician</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="stats.audit_trail.length === 0">
                    <td colspan="5" class="text-center py-4 text-muted">
                      No distributions have been recorded yet.
                    </td>
                  </tr>
                  <tr v-for="log in stats.audit_trail" :key="log.id">
                    <td class="font-medium whitespace-nowrap">{{ log.date }}</td>
                    <td class="font-bold">{{ log.farmer_name }}</td>
                    <td>{{ log.program_name }}</td>
                    <td>
                      <span class="dispense-badge">{{ log.dispensed }}</span>
                    </td>
                    <td class="text-muted">{{ log.technician }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div v-if="errorMsg" class="error-banner mt-4">
          {{ errorMsg }}
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonIcon, IonButton, IonSpinner 
} from '@ionic/vue';
import { layersOutline, peopleOutline, leafOutline, refreshOutline } from 'ionicons/icons';
import axiosInstance from '@/utils/axios';

const stats = ref<any>(null);
const isLoading = ref(true);
const errorMsg = ref('');

const fetchStats = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  
  try {
    const res = await axiosInstance.get('/dashboard/stats');
    stats.value = res.data.data;
  } catch (error: any) {
    console.error("Failed to load dashboard data", error);
    errorMsg.value = "Failed to communicate with the server. Please check your connection.";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchStats();
});
</script>

<style scoped>
.auth-bg { --background: #f4f8f5; }
.dashboard-wrapper { max-width: 1200px; margin: 0 auto; padding-top: 1rem; padding-bottom: 2rem; }

.header-section { margin-bottom: 1.5rem; }
.header-section h2 { font-weight: 800; color: #1a4731; margin: 0 0 5px 0; }
.text-muted { color: #6c757d; font-size: 0.95rem; }

.loading-state { text-align: center; margin-top: 4rem; color: #1a4731; font-weight: 600; }

/* KPI Cards */
.mb-4 { margin-bottom: 1.5rem; }
.kpi-card { margin: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.03); border-radius: 12px; border: 1px solid #e2e8f0; }
.kpi-card ion-card-content { display: flex; align-items: center; gap: 15px; padding: 1.2rem; }
.kpi-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; flex-shrink: 0; }
.bg-green-light { background: #e8f5e9; color: #2e7d32; }
.bg-blue-light { background: #e3f2fd; color: #1565c0; }
.bg-gold-light { background: #fff8e1; color: #f57f17; }
.highlight-card { border-bottom: 4px solid #f57f17; }

.kpi-data h3 { margin: 0; font-size: 1.8rem; font-weight: 800; color: #1e293b; }
.kpi-data p { margin: 2px 0 0 0; font-size: 0.85rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

/* The Data Table */
.table-card { background: white; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; overflow: hidden; }
.table-header { display: flex; justify-content: space-between; align-items: center; padding: 1.2rem 1.5rem; border-bottom: 1px solid #e2e8f0; background: #fafafa; }
.table-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; }

.table-responsive { overflow-x: auto; }
.mao-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
.mao-table th { padding: 1rem 1.5rem; background: #f8fafc; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
.mao-table td { padding: 1rem 1.5rem; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
.mao-table tr:hover { background-color: #f8fafc; }
.mao-table tr:last-child td { border-bottom: none; }

.font-bold { font-weight: 700; color: #0f172a; }
.font-medium { font-weight: 500; }
.whitespace-nowrap { white-space: nowrap; }

.dispense-badge { display: inline-block; padding: 4px 10px; background: #e8f5e9; color: #2e7d32; border-radius: 20px; font-weight: 700; font-size: 0.85rem; }

.error-banner { background: #ffebee; color: #c0392b; padding: 12px; border-radius: 8px; font-weight: 600; text-align: center; }
.py-4 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.text-center { text-align: center; }
</style>