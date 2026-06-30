<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Broadcast Center</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding auth-bg">
      <div class="dashboard-wrapper">
        <div class="header-section mb-4">
          <h2>Outreach & Communications</h2>
          <p class="text-muted">Broadcast SMS alerts, weather warnings, and distribution schedules to farmers.</p>
        </div>

        <ion-grid>
          <ion-row>
            <ion-col size="12" size-md="8">
              
              <ion-card class="action-card">
                <ion-card-header>
                  <ion-card-title style="font-size: 1.1rem; color: #1a4731;">Compose Broadcast</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-item class="custom-textarea">
                    <ion-textarea 
                      v-model="form.message" 
                      placeholder="Type your official MAO advisory here..." 
                      :auto-grow="true" 
                      :rows="4"
                      :maxlength="160"
                    ></ion-textarea>
                  </ion-item>
                  <div class="char-counter text-right mt-1 text-muted" :class="{'text-danger': form.message.length >= 160}">
                    {{ form.message.length }} / 160 chars
                  </div>
                </ion-card-content>
              </ion-card>

              <ion-card class="action-card mt-3">
                <ion-card-header>
                  <ion-card-title style="font-size: 1.1rem; color: #1a4731;">Target Selection</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-row>
                    <ion-col size="6">
                      <ion-item class="custom-input">
                        <ion-select v-model="form.target_barangay" label="Target Barangay" label-placement="floating">
                          <ion-select-option value="All">All Barangays</ion-select-option>
                          <ion-select-option value="San Fabian">San Fabian</ion-select-option>
                          <ion-select-option value="Poblacion">Poblacion</ion-select-option>
                          <ion-select-option value="Maligaya">Maligaya</ion-select-option>
                        </ion-select>
                      </ion-item>
                    </ion-col>
                    <ion-col size="6">
                      <ion-item class="custom-input">
                        <ion-select v-model="form.target_commodity" label="Target Commodity" label-placement="floating">
                          <ion-select-option value="All">All Farmers</ion-select-option>
                          <ion-select-option value="Rice (Palay)">Rice (Palay) Farmers</ion-select-option>
                          <ion-select-option value="Corn">Corn Farmers</ion-select-option>
                        </ion-select>
                      </ion-item>
                    </ion-col>
                  </ion-row>

                  <div class="action-bar mt-4">
                    <div class="status-indicator text-muted">
                      <ion-icon :icon="radioOutline" class="mr-1"></ion-icon> IPROG SMS API Ready
                    </div>
                    <ion-button color="success" @click="sendBroadcast" :disabled="isSending || form.message.length === 0">
                      <ion-icon slot="end" :icon="sendOutline"></ion-icon>
                      {{ isSending ? 'Sending...' : 'Send Broadcast' }}
                    </ion-button>
                  </div>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <ion-col size="12" size-md="4">
              <ion-card class="action-card h-100">
                <ion-card-header>
                  <ion-card-title style="font-size: 1.1rem; color: #1a4731;">Recent Activity</ion-card-title>
                </ion-card-header>
                <ion-card-content class="ion-no-padding">
                  <ion-list lines="full">
                    <div v-if="isLoadingLogs" class="text-center p-3"><ion-spinner></ion-spinner></div>
                    <div v-else-if="logs.length === 0" class="text-center p-3 text-muted">No broadcasts sent yet.</div>
                    
                    <ion-item v-for="log in logs" :key="log.id">
                      <ion-label>
                        <h3 style="font-weight: 700;">{{ log.target_barangay }} • {{ log.target_commodity }}</h3>
                        <p class="text-truncate">{{ log.message_body }}</p>
                        <p style="font-size: 0.75rem;" class="mt-1">
                          <ion-badge :color="log.status === 'Success' ? 'success' : 'danger'">{{ log.status }}</ion-badge>
                          <span style="margin-left: 10px;">{{ log.recipient_count }} Recipients</span>
                        </p>
                      </ion-label>
                    </ion-item>
                  </ion-list>
                </ion-card-content>
              </ion-card>
            </ion-col>

          </ion-row>
        </ion-grid>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonTextarea, IonSelect, IonSelectOption, IonButton, IonIcon, IonList, IonLabel, IonBadge, IonSpinner
} from '@ionic/vue';
import { sendOutline, radioOutline } from 'ionicons/icons';
import axiosInstance from '@/utils/axios';

const form = ref({
  message: '',
  target_barangay: 'All',
  target_commodity: 'All'
});

const isSending = ref(false);
const logs = ref<any[]>([]);
const isLoadingLogs = ref(true);

const fetchLogs = async () => {
  try {
    const res = await axiosInstance.get('/broadcasts');
    logs.value = res.data.data;
  } catch (error) {
    console.error("Failed to load broadcast logs", error);
  } finally {
    isLoadingLogs.value = false;
  }
};

const sendBroadcast = async () => {
  if (!confirm("Are you sure you want to broadcast this official advisory?")) return;
  
  isSending.value = true;
  try {
    const res = await axiosInstance.post('/broadcasts/send', {
      message_body: form.value.message,
      target_barangay: form.value.target_barangay,
      target_commodity: form.value.target_commodity
    });
    
    alert(res.data.message);
    form.value.message = ''; // Reset message
    fetchLogs(); // Refresh the right-hand panel
  } catch (error: any) {
    alert(error.response?.data?.message || 'Broadcast failed.');
  } finally {
    isSending.value = false;
  }
};

onMounted(() => {
  fetchLogs();
});
</script>

<style scoped>
.auth-bg { --background: #f4f8f5; }
.dashboard-wrapper { max-width: 1200px; margin: 0 auto; padding-top: 1rem; }

.header-section h2 { font-weight: 800; color: #1a4731; margin: 0 0 5px 0; }
.text-muted { color: #6c757d; font-size: 0.95rem; }
.text-danger { color: #c0392b; font-weight: 700; }
.mb-4 { margin-bottom: 1.5rem; }
.mt-3 { margin-top: 1rem; }
.mt-4 { margin-top: 1.5rem; }

.action-card { border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; }
.h-100 { height: 100%; }

.custom-textarea { --background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
.custom-input { --background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; }

.char-counter { font-size: 0.8rem; }
.text-right { text-align: right; }

.action-bar { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 15px; }
.status-indicator { display: flex; align-items: center; font-size: 0.85rem; font-weight: 600; }
.mr-1 { margin-right: 5px; }
.text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px; }
</style>