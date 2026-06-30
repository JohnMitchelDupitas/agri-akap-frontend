<template>
  <ion-page>
    <ion-header class="no-print">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>ID Issuance Portal</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding auth-bg no-print-bg">
      <div class="issuance-container no-print">
        
        <div class="header-section mb-4">
          <h2>Review Farmer Credentials</h2>
          <p class="text-muted">Select a verified beneficiary to generate and print their official RSBSA QR Identification.</p>
        </div>

        <ion-grid>
          <ion-row>
            <ion-col size="12" size-md="5" size-lg="4">
              <ion-card class="list-card">
                <ion-card-header>
                  <ion-card-title style="font-size: 1.1rem;">Verified Farmers</ion-card-title>
                </ion-card-header>
                <ion-card-content class="ion-no-padding">
                  
                  <div v-if="isLoading" class="text-center p-4">
                    <ion-spinner name="crescent"></ion-spinner>
                  </div>
                  
                  <ion-list v-else>
                    <ion-item 
                      v-for="farmer in farmers" 
                      :key="farmer.id" 
                      button 
                      @click="selectFarmer(farmer)"
                      :color="selectedFarmer?.id === farmer.id ? 'light' : ''"
                    >
                      <ion-label>
                        <h2><strong>{{ farmer.first_name }} {{ farmer.surname }}</strong></h2>
                        <p>{{ farmer.rsbsa_number }}</p>
                        <p style="font-size: 0.8rem; color: #2e7d32;">{{ farmer.barangay }}</p>
                      </ion-label>
                    </ion-item>
                  </ion-list>

                </ion-card-content>
              </ion-card>
            </ion-col>

            <ion-col size="12" size-md="7" size-lg="8" class="preview-col">
              
              <div v-if="!selectedFarmer" class="empty-preview">
                <p>Select a farmer from the list to preview their ID card.</p>
              </div>

              <div v-else class="id-preview-wrapper">
                <div class="action-bar mb-3">
                  <ion-badge color="success">STATUS: READY FOR ISSUANCE</ion-badge>
                  <ion-button color="dark" @click="printID">
                    <ion-icon slot="start" :icon="printOutline"></ion-icon>
                    Print ID Card
                  </ion-button>
                </div>

                <div class="id-card" id="printable-id">
                  
                  <div class="id-header">
                    <img src="@/assets/images/mao-echague-logo.png" alt="MAO Logo" class="id-logo" />
                    <div class="id-header-text">
                      <p class="gov-title">MUNICIPAL AGRICULTURE OFFICE</p>
                      <p class="gov-sub">Echague, Isabela</p>
                    </div>
                  </div>

                  <div class="id-body">
                    <div class="photo-section">
                      <div class="photo-box">
                        <ion-icon :icon="personOutline" class="photo-icon"></ion-icon>
                      </div>
                      <div class="badge-role">REGISTERED FARMER</div>
                    </div>

                    <div class="details-section">
                      <div class="detail-group">
                        <span class="detail-label">RSBSA NUMBER</span>
                        <span class="detail-value highlight">{{ selectedFarmer.rsbsa_number }}</span>
                      </div>

                      <div class="detail-row">
                        <div class="detail-group">
                          <span class="detail-label">BARANGAY</span>
                          <span class="detail-value">{{ selectedFarmer.barangay }}</span>
                        </div>
                        <div class="detail-group">
                          <span class="detail-label">SEX</span>
                          <span class="detail-value">{{ selectedFarmer.gender || 'M/F' }}</span>
                        </div>
                      </div>

                      <div class="detail-group mt-2">
                        <span class="detail-label">FULL NAME</span>
                        <span class="detail-value name-value">
                          {{ selectedFarmer.first_name }} {{ selectedFarmer.middle_name ? selectedFarmer.middle_name[0] + '.' : '' }} {{ selectedFarmer.surname }}
                        </span>
                      </div>
                    </div>

                    <div class="qr-section">
                      <qrcode-vue :value="selectedFarmer.id" :size="90" level="H" />
                    </div>
                  </div>

                  <div class="id-footer" :class="{'priority-band': isPriority(selectedFarmer)}">
                    <span v-if="isPriority(selectedFarmer)">★ PRIORITY ACCESS - SENIOR/PWD</span>
                    <span v-else>OFFICIAL GOVERNMENT BENEFICIARY</span>
                  </div>

                </div>
                </div>
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
  IonList, IonItem, IonLabel, IonBadge, IonButton, IonIcon, IonSpinner
} from '@ionic/vue';
import { printOutline, personOutline } from 'ionicons/icons';
import QrcodeVue from 'qrcode.vue';
import axiosInstance from '@/utils/axios';

const farmers = ref<any[]>([]);
const selectedFarmer = ref<any>(null);
const isLoading = ref(true);

// Fetch farmers from backend
const fetchFarmers = async () => {
  try {
    const response = await axiosInstance.get('/farmers');
    farmers.value = response.data.data.data; // Assumes Laravel pagination
  } catch (error) {
    console.error("Failed to fetch farmers:", error);
  } finally {
    isLoading.value = false;
  }
};

const selectFarmer = (farmer: any) => {
  selectedFarmer.value = farmer;
};

// Logic to determine if they get the Gold Priority Band
const isPriority = (farmer: any) => {
  if (!farmer.date_of_birth) return false;
  
  // Calculate age
  const birthDate = new Date(farmer.date_of_birth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
  }
  
  // Priority if age is 60 or above (Senior Citizen)
  return age >= 60;
};

const printID = () => {
  window.print();
};

onMounted(() => {
  fetchFarmers();
});
</script>

<style scoped>
.auth-bg { --background: #f4f8f5; }
.issuance-container { max-width: 1200px; margin: 0 auto; padding-top: 1rem; }

.header-section h2 { font-weight: 800; color: #1a4731; margin: 0 0 5px 0; }
.text-muted { color: #6c757d; font-size: 0.95rem; }
.mb-4 { margin-bottom: 1.5rem; }
.mb-3 { margin-bottom: 1rem; }
.mt-2 { margin-top: 0.5rem; }

.list-card { border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; height: 600px; overflow-y: auto; }
.empty-preview { display: flex; align-items: center; justify-content: center; height: 100%; min-height: 400px; background: #e9ecef; border-radius: 12px; border: 2px dashed #ced4da; color: #6c757d; font-weight: 600; }

.action-bar { display: flex; justify-content: space-between; align-items: center; }

/* 🪪 ID CARD STYLING */
.id-card {
  width: 500px; /* Scaled slightly up for preview, standard ID ratio */
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  overflow: hidden;
  border: 1px solid #d1d5db;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  position: relative;
  margin: 0 auto;
}

.id-header {
  background: #1a4731; /* MAO Dark Green */
  color: white;
  display: flex;
  align-items: center;
  padding: 15px 20px;
}
.id-logo { width: 45px; height: 45px; margin-right: 15px; background: white; border-radius: 50%; padding: 2px; }
.id-header-text { display: flex; flex-direction: column; }
.gov-title { margin: 0; font-size: 14px; font-weight: 800; letter-spacing: 1px; }
.gov-sub { margin: 0; font-size: 11px; opacity: 0.9; letter-spacing: 2px; text-transform: uppercase; }

.id-body {
  display: flex;
  padding: 20px;
  gap: 20px;
  background: #fafafa;
}

/* Photo Area */
.photo-section { display: flex; flex-direction: column; align-items: center; width: 110px; }
.photo-box { width: 100px; height: 100px; background: #e2e8f0; border: 2px solid #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; overflow: hidden; }
.photo-icon { font-size: 3rem; color: #94a3b8; }
.badge-role { font-size: 9px; font-weight: 800; background: #e2e8f0; color: #475569; padding: 4px 8px; border-radius: 4px; text-align: center; }

/* Details Area */
.details-section { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; }
.detail-group { display: flex; flex-direction: column; margin-bottom: 10px; }
.detail-row { display: flex; gap: 20px; }
.detail-label { font-size: 9px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; }
.detail-value { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 2px; text-transform: uppercase; }
.name-value { font-size: 18px; font-weight: 800; }
.highlight { color: #1a4731; font-family: monospace; font-size: 16px; letter-spacing: 1px; }

/* QR Code Area */
.qr-section { width: 100px; display: flex; align-items: center; justify-content: center; background: white; padding: 5px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

/* Footer / Priority Band */
.id-footer { background: #e2e8f0; color: #475569; text-align: center; padding: 8px; font-size: 11px; font-weight: 700; letter-spacing: 1px; }
.priority-band { background: #d4af37 !important; /* Gold */ color: #fff !important; }

/* 🖨️ PRINT-SPECIFIC CSS (The Magic Trick) */
@media print {
  body * {
    visibility: hidden; /* Hide absolutely everything */
  }
  
  /* Make the background strictly white to save printer ink */
  body, .no-print-bg {
    background-color: white !important;
  }

  /* Only show the ID Card and its children */
  #printable-id, #printable-id * {
    visibility: visible;
  }

  /* Reposition the ID card to the top left of the printed paper */
  #printable-id {
    position: absolute;
    left: 0;
    top: 0;
    width: 3.375in; /* Standard CR80 ID Card Width */
    height: 2.125in; /* Standard CR80 ID Card Height */
    transform: scale(1);
    border: none;
    box-shadow: none;
  }

  /* Strip out Web UI Elements */
  .no-print {
    display: none !important;
  }
}
</style>