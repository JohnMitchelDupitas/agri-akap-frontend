<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Subsidy Distribution</ion-title>
        <ion-buttons slot="end">
          <ion-chip :color="syncStore.online ? 'light' : 'warning'" style="--background:rgba(255,255,255,0.15);">
            <ion-icon :icon="syncStore.online ? cloudDoneOutline : cloudOfflineOutline"></ion-icon>
            <ion-label>{{ syncStore.online ? 'Online' : 'Offline' }}</ion-label>
          </ion-chip>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="scan-bg ion-padding">

      <!-- STATE 1: PROGRAM SELECTION + SCAN -->
      <div v-if="!scanResult" class="setup-container">

        <!-- Program Selection -->
        <ion-card class="program-card">
          <ion-card-header>
            <ion-card-title class="step-label">Step 1 — Select Program</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item class="program-select-item">
              <ion-select
                v-model="selectedProgramId"
                placeholder="Choose an active campaign..."
                @ionChange="onProgramChange"
              >
                <ion-select-option v-for="p in programs" :key="p.id" :value="p.id">
                  {{ p.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <!-- Selected program details -->
            <div v-if="selectedProgram" class="program-details">
              <div class="pd-row">
                <span class="pd-label">Type</span>
                <ion-badge color="primary">{{ selectedProgram.type }}</ion-badge>
              </div>
              <div class="pd-row">
                <span class="pd-label">Inventory Remaining</span>
                <strong>{{ selectedProgram.remaining_quantity?.toLocaleString() }} {{ selectedProgram.unit_of_measurement }}</strong>
              </div>
              <div class="pd-row">
                <span class="pd-label">Allocation Rate</span>
                <strong>{{ selectedProgram.per_hectare_allocation }} {{ selectedProgram.unit_of_measurement }}/ha</strong>
              </div>
              <div class="pd-row">
                <span class="pd-label">Valid Until</span>
                <strong>{{ selectedProgram.end_date }}</strong>
              </div>
              <ion-progress-bar
                :value="(selectedProgram.remaining_quantity / selectedProgram.total_quantity) || 0"
                :color="remainingPercent < 20 ? 'danger' : 'success'"
              ></ion-progress-bar>
              <p class="pd-pct">{{ remainingPercent }}% stock remaining</p>
            </div>

            <div v-if="!programs.length" class="no-programs">
              No active programs available{{ !syncStore.online ? ' (offline cache empty)' : '' }}
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Scan Button -->
        <div class="action-wrapper">
          <ion-button
            expand="block"
            size="large"
            class="scan-btn"
            :disabled="!selectedProgramId"
            @click="startScan"
          >
            <ion-icon slot="start" :icon="qrCodeOutline"></ion-icon>
            TAP TO SCAN FARMER ID
          </ion-button>
          <p class="helper-text" v-if="!selectedProgramId">Select a program to enable scanning.</p>
        </div>
      </div>

      <!-- STATE 2: RESULT -->
      <div v-if="scanResult" class="result-container animation-fade-in">

        <ion-card v-if="scanResult.status === 'success'" :color="scanResult.offline ? 'warning' : 'success'">
          <ion-card-header>
            <ion-icon
              :icon="scanResult.offline ? cloudOfflineOutline : checkmarkCircleOutline"
              class="result-icon"
            ></ion-icon>
            <ion-card-title class="text-white">
              {{ scanResult.offline ? 'Queued Offline' : 'Claim Approved' }}
            </ion-card-title>
          </ion-card-header>
          <ion-card-content class="text-white">
            <template v-if="scanResult.offline">
              <p>This claim is saved on your device and will sync automatically when reconnected. Eligibility will be verified on upload.</p>
            </template>
            <template v-else>
              <h2 class="farmer-name-result">{{ scanResult.data?.farmer_name }}</h2>
              <div class="detail-row-r"><span>Farm Size:</span><strong>{{ scanResult.data?.total_farm_size }} ha</strong></div>
              <div class="detail-row-r"><span>Eligible Size:</span><strong>{{ scanResult.data?.eligible_size_capped }} ha</strong></div>
              <div class="dispense-box">
                <span class="dispense-label">DISPENSE NOW:</span>
                <span class="dispense-qty">{{ scanResult.data?.quantity_dispensed }}</span>
                <span class="dispense-unit">{{ selectedProgram?.unit_of_measurement }}</span>
              </div>
              <p class="remaining-note">Inventory Remaining: <strong>{{ scanResult.data?.inventory_remaining }}</strong></p>
            </template>
          </ion-card-content>
        </ion-card>

        <ion-card v-else color="danger">
          <ion-card-header>
            <ion-icon :icon="warningOutline" class="result-icon"></ion-icon>
            <ion-card-title class="text-white">Claim Rejected</ion-card-title>
          </ion-card-header>
          <ion-card-content class="text-white">
            <p class="error-msg">{{ scanResult.message }}</p>
            <p v-if="scanResult.data?.claimed_at" class="claimed-at">
              Already claimed on: {{ new Date(scanResult.data.claimed_at).toLocaleString() }}
            </p>
          </ion-card-content>
        </ion-card>

        <ion-button expand="block" fill="outline" class="mt-4" @click="resetScanner">
          <ion-icon slot="start" :icon="qrCodeOutline"></ion-icon>
          Scan Next Farmer
        </ion-button>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSelect, IonSelectOption,
  IonButton, IonIcon, IonItem, IonChip, IonLabel, IonBadge, IonProgressBar,
  toastController,
} from '@ionic/vue';
import {
  qrCodeOutline, checkmarkCircleOutline, warningOutline,
  cloudDoneOutline, cloudOfflineOutline,
} from 'ionicons/icons';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import apiClient from '@/utils/axios';
import { useSyncStore } from '@/stores/syncStore';
import { getPrograms, isOnline, queueDistribution } from '@/services/syncService';

const syncStore = useSyncStore();
const selectedProgramId = ref('');
const scanResult = ref<any>(null);
const programs = ref<any[]>([]);

const selectedProgram = computed(() =>
  programs.value.find(p => p.id === selectedProgramId.value) ?? null
);

const remainingPercent = computed(() => {
  if (!selectedProgram.value?.total_quantity) return 0;
  return Math.round((selectedProgram.value.remaining_quantity / selectedProgram.value.total_quantity) * 100);
});

const onProgramChange = () => { scanResult.value = null; };

onMounted(async () => {
  programs.value = await getPrograms();
});

const showToast = async (msg: string, color: 'warning' | 'danger' = 'warning') => {
  const t = await toastController.create({ message: msg, duration: 3000, color, position: 'top' });
  await t.present();
};

const startScan = async () => {
  try {
    const { camera } = await BarcodeScanner.requestPermissions();
    if (camera !== 'granted' && camera !== 'limited') {
      await showToast('Camera permission is required to scan farmer IDs.', 'warning');
      return;
    }
    const { barcodes } = await BarcodeScanner.scan();
    if (barcodes.length > 0 && barcodes[0].rawValue) {
      await processClaim(barcodes[0].rawValue);
    }
  } catch {
    await showToast('Scanner failed to start. Check camera permissions in device settings.', 'danger');
  }
};

const processClaim = async (farmerUuid: string) => {
  const uuid = farmerUuid.trim();
  if (!uuid) {
    scanResult.value = { status: 'error', message: 'No Farmer ID detected. Please scan again.' };
    return;
  }
  if (!selectedProgramId.value) {
    scanResult.value = { status: 'error', message: 'Please select an active program first.' };
    return;
  }

  const program = selectedProgram.value;

  if (!isOnline()) {
    await queueDistribution({ farmer_id: uuid, program_id: selectedProgramId.value, program_name: program?.name });
    await syncStore.refreshCount();
    scanResult.value = { status: 'success', offline: true };
    return;
  }

  try {
    const response = await apiClient.post('/distributions/claim', {
      farmer_id: uuid,
      program_id: selectedProgramId.value,
    });
    scanResult.value = response.data;
  } catch (err: any) {
    if (!err.response) {
      await queueDistribution({ farmer_id: uuid, program_id: selectedProgramId.value, program_name: program?.name });
      await syncStore.refreshCount();
      scanResult.value = { status: 'success', offline: true };
      return;
    }
    scanResult.value = err.response?.data ?? { status: 'error', message: 'Network error. Could not reach verification server.' };
  }
};

const resetScanner = () => {
  scanResult.value = null;
};
</script>

<style scoped>
.scan-bg { --background: #f4f8f5; }
.setup-container { max-width: 680px; margin: 0 auto; }
.program-card { border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.step-label { font-size: 1rem; color: #1a4731; font-weight: 800; }
.program-select-item { --background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 0; }

.program-details { margin-top: 1rem; background: #f8fafc; border-radius: 8px; padding: 12px; border: 1px solid #e2e8f0; }
.pd-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 0.9rem; }
.pd-label { color: #64748b; }
.pd-pct { font-size: 0.78rem; color: #64748b; text-align: right; margin: 4px 0 0; }

.no-programs { color: var(--ion-color-danger); padding: 12px 0; font-size: 0.9rem; font-weight: 600; }

.action-wrapper { margin-top: 2rem; text-align: center; }
.scan-btn { --border-radius: 14px; height: 90px; font-size: 1.1rem; font-weight: 800; letter-spacing: 1.5px; }
.helper-text { color: var(--ion-color-medium); font-size: 0.88rem; margin-top: 0.75rem; }

.result-container { max-width: 680px; margin: 2rem auto 0; }
.result-icon { font-size: 3rem; margin-bottom: 0.5rem; }
.text-white { color: white !important; }
.farmer-name-result { font-weight: 900; font-size: 1.5rem; margin: 0 0 1rem; }
.detail-row-r { display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.95rem; }
.dispense-box { background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.6); border-radius: 10px; padding: 1.2rem; margin-top: 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.dispense-label { font-size: 0.8rem; letter-spacing: 2px; opacity: 0.85; }
.dispense-qty { font-size: 3rem; font-weight: 900; line-height: 1; }
.dispense-unit { font-size: 1rem; opacity: 0.85; }
.remaining-note { font-size: 0.82rem; margin-top: 1rem; opacity: 0.85; }
.error-msg { font-size: 1.1rem; line-height: 1.4; font-weight: 600; }
.claimed-at { font-size: 0.85rem; margin-top: 0.75rem; opacity: 0.85; }
.mt-4 { margin-top: 1.5rem; }
.animation-fade-in { animation: fadeIn 0.35s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
</style>
