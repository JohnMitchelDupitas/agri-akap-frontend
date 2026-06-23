<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Subsidy Distribution</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      
      <!-- 🔴 STATE 1: INITIAL SETUP & PROGRAM SELECTION -->
      <div v-if="!scanResult" class="setup-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Step 1: Select Active Program</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label>Active Program</ion-label>
              <ion-select v-model="selectedProgramId" placeholder="Choose a campaign...">
                <ion-spinner v-if="programStore.isLoading" name="crescent"></ion-spinner>
                <ion-select-option 
                  v-for="program in programStore.activePrograms()" 
                  :key="program.id" 
                  :value="program.id"
                >
                  {{ program.name }}
                </ion-select-option>
                <div v-if="!programStore.isLoading && programStore.activePrograms().length === 0" style="padding: 12px; color: red;">
                  No active programs available
                </div>
              </ion-select>
            </ion-item>
            <div v-if="programStore.error" style="color: red; font-size: 0.9rem; margin-top: 0.5rem;">
              {{ programStore.error }}
            </div>
          </ion-card-content>
        </ion-card>

        <div class="action-wrapper">
          <ion-button 
            expand="block" 
            size="large" 
            class="scan-btn" 
            :disabled="!selectedProgramId" 
            @click="startScan"
          >
            <ion-icon slot="start" :icon="qrCodeOutline"></ion-icon>
            TAP TO SCAN ID
          </ion-button>

          <!-- 🔴 DEVELOPER TEST HACK (Remove before production) -->
      <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px dashed #ccc;">
            <p style="font-size: 0.8rem; color: gray; margin-bottom: 0.5rem;">DEVELOPER MODE: BYPASS CAMERA</p>
            
            <input 
              type="text" 
              v-model="testFarmerUuid" 
              placeholder="Paste Farmer UUID here..." 
              style="width: 100%; padding: 12px; border: 1px solid #999; border-radius: 6px; margin-bottom: 10px; font-size: 16px; color: black; background: white;"
            />

            <ion-button expand="block" color="medium" @click="processClaim(testFarmerUuid)">
              Simulate QR Scan
            </ion-button>
          </div>
          <!-- 🔴 END HACK -->


          <p class="helper-text" v-if="!selectedProgramId">Please select a program first.</p>
        </div>
      </div>

      <!-- 🔴 STATE 2: THE VERIFICATION RESULT -->
      <div v-if="scanResult" class="result-container animation-fade-in">
        
        <!-- SUCCESS CARD -->
        <ion-card v-if="scanResult.status === 'success'" color="success">
          <ion-card-header>
            <ion-icon :icon="checkmarkCircle" class="result-icon"></ion-icon>
            <ion-card-title class="text-white">Verification Passed</ion-card-title>
          </ion-card-header>
          <ion-card-content class="text-white">
            <h2 style="font-weight: 800; font-size: 1.5rem; margin-bottom: 0.5rem;">
              {{ scanResult.data.farmer_name }}
            </h2>
            <p><strong>Total Farm Size:</strong> {{ scanResult.data.total_farm_size }}</p>
            <p><strong>Eligible Size:</strong> {{ scanResult.data.eligible_size_capped }}</p>
            
            <div class="dispense-box">
              <span>DISPENSE NOW:</span>
              <span class="dispense-qty">{{ scanResult.data.quantity_dispensed }}</span>
            </div>
            
            <p style="font-size: 0.8rem; margin-top: 1rem;">
              Inventory Remaining: {{ scanResult.data.inventory_remaining }}
            </p>
          </ion-card-content>
        </ion-card>

        <!-- FRAUD / ERROR CARD -->
        <ion-card v-else color="danger">
          <ion-card-header>
            <ion-icon :icon="warningOutline" class="result-icon"></ion-icon>
            <ion-card-title class="text-white">Claim Rejected</ion-card-title>
          </ion-card-header>
          <ion-card-content class="text-white">
            <p class="error-msg"><strong>{{ scanResult.message }}</strong></p>
            <p v-if="scanResult.data?.claimed_at" style="margin-top: 1rem;">
              <em>Already claimed on: {{ scanResult.data.claimed_at }}</em>
            </p>
          </ion-card-content>
        </ion-card>

        <ion-button expand="block" fill="outline" class="mt-4" @click="resetScanner">
          Scan Next Farmer
        </ion-button>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSelect, IonSelectOption,
  IonButton, IonIcon, IonItem, IonInput, IonLabel, IonSpinner
} from '@ionic/vue';
import { qrCodeOutline, checkmarkCircle, warningOutline } from 'ionicons/icons';

// 1. Import the ML Kit Plugin
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import axiosInstance from '@/utils/axios';
import { useProgramStore } from '@/stores/programStore';

const selectedProgramId = ref('');
const scanResult = ref<any>(null);
const testFarmerUuid = ref('');

const programStore = useProgramStore();

// Fetch programs on component mount
onMounted(() => {
  programStore.fetchPrograms();
});

// --- ML KIT SCANNER LOGIC ---

const startScan = async () => {
  try {
    // 1. Request Camera Permissions using ML Kit
    const { camera } = await BarcodeScanner.requestPermissions();
    if (camera !== 'granted' && camera !== 'limited') {
      alert("Camera permission is required to scan IDs.");
      return;
    }

    // 2. Launch the native ML Kit Scanner overlay
    const { barcodes } = await BarcodeScanner.scan();

    // 3. Process the scanned QR code if one was found
    if (barcodes.length > 0 && barcodes[0].rawValue) {
      const scannedFarmerUuid = barcodes[0].rawValue;
      await processClaim(scannedFarmerUuid);
    }
  } catch (error) {
    console.error("Scanner Error:", error);
    alert("Scanner failed to start. Please check camera permissions.");
  }
};

// --- API CLAIMING LOGIC ---

const processClaim = async (farmerUuid: string) => {
  try {
    // 🔴 1. FRONTEND GUARD: Stop empty payloads before they hit Laravel
    if (!farmerUuid || farmerUuid.trim() === '') {
      scanResult.value = {
        status: 'error',
        message: 'No Farmer UUID detected! Please paste a valid UUID or scan a QR code.'
      };
      return; // Stop execution
    }

    // 🔴 2. FRONTEND GUARD: Ensure a program is selected
    if (!selectedProgramId.value) {
      scanResult.value = {
        status: 'error',
        message: 'Please select an active program from the dropdown first.'
      };
      return; 
    }

    // Hit the pessimistic locking API
    const response = await axiosInstance.post('/distributions/claim', {
      farmer_id: farmerUuid.trim(), // Added .trim() to remove accidental spaces when copy/pasting
      program_id: selectedProgramId.value
    });
    
    scanResult.value = response.data; // Success Response

  } catch (error: any) {
    scanResult.value = error.response?.data || {
      status: 'error',
      message: 'Network error. Could not reach verification server.'
    };
  }
};

const resetScanner = () => {
  scanResult.value = null;
};
</script>

<style scoped>
/* UI Styling */
.setup-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
}
.action-wrapper {
  margin-top: 2rem;
  text-align: center;
}
.scan-btn {
  --border-radius: 12px;
  height: 80px;
  font-weight: 800;
  letter-spacing: 1px;
}
.helper-text {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin-top: 1rem;
}

/* Result Cards */
.result-container {
  margin-top: 2rem;
}
.result-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}
.text-white {
  color: white !important;
}
.dispense-box {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid white;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
}
.dispense-qty {
  font-size: 2.5rem;
  font-weight: 900;
}
.error-msg {
  font-size: 1.2rem;
  line-height: 1.4;
}
.animation-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>