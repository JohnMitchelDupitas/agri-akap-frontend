<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Subsidy Programs</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding auth-bg">
      <div class="dashboard-container">
        
        <div class="header-actions">
          <h2>Active Campaigns</h2>
          <ion-button @click="isModalOpen = true" color="success">
            + New Program
          </ion-button>
        </div>

        <div v-if="isLoading" class="text-center mt-4">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Loading programs...</p>
        </div>

        <div v-else-if="programs.length === 0" class="empty-state">
          <h3>No Active Programs</h3>
          <p>Click the button above to initialize a new distribution campaign.</p>
        </div>

        <div class="programs-grid" v-else>
          <ion-card v-for="program in programs" :key="program.id" class="program-card">
            <ion-card-header>
              <div class="card-title-row">
                <ion-card-title class="program-title">{{ program.name }}</ion-card-title>
                <ion-badge :color="program.is_active ? 'success' : 'medium'">
                  {{ program.is_active ? 'Active' : 'Closed' }}
                </ion-badge>
              </div>
              <ion-card-subtitle class="text-capitalize">{{ program.type }} Subsidy</ion-card-subtitle>
            </ion-card-header>

            <ion-card-content>
              <div class="inventory-tracker">
                <div class="inv-labels">
                  <span>Inventory Remaining</span>
                  <strong>{{ program.remaining_quantity }} / {{ program.total_quantity }} {{ program.unit_of_measurement }}</strong>
                </div>
                <div class="progress-bar-bg">
                  <div 
                    class="progress-bar-fill" 
                    :style="{ width: getPercentage(program.remaining_quantity, program.total_quantity) + '%' }"
                    :class="{ 'low-stock': getPercentage(program.remaining_quantity, program.total_quantity) < 20 }"
                  ></div>
                </div>
              </div>

              <div class="allocation-rules mt-3">
                <p><strong>Rule:</strong> {{ program.per_hectare_allocation }} {{ program.unit_of_measurement }} per Ha.</p>
                <p><strong>Cap:</strong> Max {{ program.max_hectare_cap }} Ha. per farmer.</p>
                <p class="text-muted small">Valid: {{ formatDate(program.start_date) }} to {{ formatDate(program.end_date) }}</p>
                <p class="text-muted small">Beneficiaries: <strong>{{ program.distributions_count ?? 0 }}</strong></p>
              </div>

              <ion-button
                v-if="authStore.userRole === 'admin' && program.is_active"
                expand="block"
                fill="outline"
                color="medium"
                size="small"
                class="mt-2"
                @click="deactivateProgram(program)"
              >
                Deactivate Program
              </ion-button>
            </ion-card-content>
          </ion-card>
        </div>
      </div>

      <CreateProgramModal 
        :is-open="isModalOpen" 
        @close="isModalOpen = false" 
        @program-created="onProgramCreated" 
      />

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonBadge, IonSpinner, toastController, alertController,
} from '@ionic/vue';
import axiosInstance from '@/utils/axios';
import { useAuthStore } from '@/stores/authStore';
import CreateProgramModal from './CreateProgramModal.vue';

const programs = ref<any[]>([]);
const isLoading = ref(true);
const isModalOpen = ref(false);
const authStore = useAuthStore();

const fetchPrograms = async () => {
  isLoading.value = true;
  try {
    const res = await axiosInstance.get('/programs');
    programs.value = res.data.data.data ?? [];
  } catch {
    const t = await toastController.create({ message: 'Failed to load programs.', duration: 2500, color: 'danger', position: 'top' });
    await t.present();
  } finally {
    isLoading.value = false;
  }
};

const deactivateProgram = async (program: any) => {
  const alert = await alertController.create({
    header: 'Deactivate Program',
    message: `Are you sure you want to deactivate "<strong>${program.name}</strong>"? Existing distributions will be preserved.`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Deactivate',
        cssClass: 'alert-btn-danger',
        handler: async () => {
          try {
            await axiosInstance.patch(`/programs/${program.id}/deactivate`);
            const t = await toastController.create({ message: 'Program deactivated.', duration: 2500, color: 'success', position: 'top' });
            await t.present();
            fetchPrograms();
          } catch (err: any) {
            const t = await toastController.create({
              message: err.response?.data?.message ?? 'Failed to deactivate.',
              duration: 2500, color: 'danger', position: 'top',
            });
            await t.present();
          }
        },
      },
    ],
  });
  await alert.present();
};

const onProgramCreated = () => {
  isModalOpen.value = false;
  fetchPrograms(); // Refresh the list
};

const getPercentage = (remaining: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((remaining / total) * 100);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

onMounted(() => {
  fetchPrograms();
});
</script>

<style scoped>
.auth-bg { --background: #f4f8f5; }
.dashboard-container { max-width: 900px; margin: 0 auto; padding-top: 1rem; }
.header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.header-actions h2 { font-weight: 800; color: #1a4731; margin: 0; }

.empty-state { text-align: center; padding: 3rem 1rem; color: #666; background: white; border-radius: 8px; border: 1px dashed #ccc; }

.programs-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 768px) { .programs-grid { grid-template-columns: 1fr 1fr; } }

.program-card { margin: 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e0e0e0; }
.card-title-row { display: flex; justify-content: space-between; align-items: flex-start; }
.program-title { font-size: 1.1rem; font-weight: 800; color: #1a4731; line-height: 1.2; }

/* Progress Bar CSS */
.inventory-tracker { margin-top: 1rem; }
.inv-labels { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.3rem; }
.progress-bar-bg { background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden; width: 100%; }
.progress-bar-fill { background: #2a6648; height: 100%; transition: width 0.5s ease; }
.progress-bar-fill.low-stock { background: #c0392b; }

.allocation-rules { background: #f8f9fa; padding: 10px; border-radius: 6px; font-size: 0.85rem; border: 1px solid #eee; }
.allocation-rules p { margin: 0 0 4px 0; }
.text-muted { color: #888; }
.text-capitalize { text-transform: capitalize; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 1rem; }
.mt-4 { margin-top: 1.5rem; }
.small { font-size: 0.82rem; }
</style>