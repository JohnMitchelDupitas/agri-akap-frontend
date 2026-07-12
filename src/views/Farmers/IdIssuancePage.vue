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
      <div class="issuance-container">

        <div class="header-section mb-4">
          <h2>Farmer ID Issuance</h2>
          <p class="text-muted">Search and select a beneficiary to generate their official RSBSA QR Identification.</p>
          <div class="color-legend">
            <span class="legend-title">ID Color Codes:</span>
            <span class="legend-item"><span class="swatch" :style="{ background: CATEGORY.regular.color }"></span>Regular</span>
            <span class="legend-item"><span class="swatch" :style="{ background: CATEGORY.senior.color }"></span>Senior Citizen (60+)</span>
            <span class="legend-item"><span class="swatch" :style="{ background: CATEGORY.pwd.color }"></span>PWD</span>
          </div>
        </div>

        <ion-grid>
          <ion-row>
            <!-- Farmer list column -->
            <ion-col size="12" size-md="5" size-lg="4">
              <ion-card class="list-card">
                <ion-card-content class="ion-no-padding">
                  <!-- Search bar -->
                  <div class="list-search">
                    <ion-searchbar
                      placeholder="Search name or barangay..."
                      @ionInput="handleSearch"
                      :debounce="400"
                      style="--background:#f8fafc;padding:8px;"
                    ></ion-searchbar>
                  </div>

                  <div v-if="isLoading" class="text-center p-4">
                    <ion-spinner name="crescent" color="primary"></ion-spinner>
                  </div>

                  <ion-list v-else lines="full">
                    <ion-item
                      v-for="farmer in farmers"
                      :key="farmer.id"
                      button
                      @click="selectFarmer(farmer)"
                      :class="{ 'selected-item': selectedFarmer?.id === farmer.id }"
                    >
                      <ion-avatar slot="start" style="background:#e8f5e9;border-radius:50%;display:flex;align-items:center;justify-content:center;">
                        <img v-if="farmer.photo_path" :src="`${API_BASE}/storage/${farmer.photo_path}`" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />
                        <span v-else style="font-weight:800;color:#1a4731;font-size:1rem;">{{ initials(farmer) }}</span>
                      </ion-avatar>
                      <ion-label>
                        <h2><strong>{{ farmer.surname }}, {{ farmer.first_name }}</strong></h2>
                        <p class="mono">{{ farmer.rsbsa_no || 'RSBSA Pending' }}</p>
                        <p style="font-size:0.8rem;color:#2e7d32;">{{ farmer.permanent_brgy }}</p>
                      </ion-label>
                      <div slot="end" style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
                        <ion-badge v-if="isPriority(farmer)" :color="catInfo(farmer).badge" style="font-size:0.6rem;">{{ catInfo(farmer).label }}</ion-badge>
                      </div>
                    </ion-item>

                    <div v-if="!isLoading && farmers.length === 0" class="text-center p-4 text-muted">
                      No farmers found.
                    </div>
                  </ion-list>

                  <!-- Pagination -->
                  <div v-if="pagination && pagination.last_page > 1" class="list-pagination">
                    <ion-button fill="clear" size="small" :disabled="pagination.current_page <= 1" @click="loadPage(pagination.current_page - 1)">
                      <ion-icon slot="icon-only" :icon="chevronBackOutline"></ion-icon>
                    </ion-button>
                    <span class="page-label">{{ pagination.current_page }}/{{ pagination.last_page }}</span>
                    <ion-button fill="clear" size="small" :disabled="pagination.current_page >= pagination.last_page" @click="loadPage(pagination.current_page + 1)">
                      <ion-icon slot="icon-only" :icon="chevronForwardOutline"></ion-icon>
                    </ion-button>
                  </div>
                </ion-card-content>
              </ion-card>
            </ion-col>

            <!-- ID Preview column -->
            <ion-col size="12" size-md="7" size-lg="8" class="preview-col">
              <div v-if="!selectedFarmer" class="empty-preview">
                <ion-icon :icon="idCardOutline" style="font-size:3rem;color:#94a3b8;"></ion-icon>
                <p>Select a farmer from the list to preview their ID card.</p>
              </div>

              <div v-else class="id-preview-wrapper">
                <div class="action-bar mb-3">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <ion-badge color="success">READY FOR ISSUANCE</ion-badge>
                    <ion-badge :color="catInfo(selectedFarmer).badge">{{ catInfo(selectedFarmer).label }}</ion-badge>
                  </div>
                  <ion-button color="dark" @click="printID">
                    <ion-icon slot="start" :icon="printOutline"></ion-icon>
                    Print ID Card
                  </ion-button>
                </div>

                <!-- THE ID CARD -->
                <div class="id-card" id="printable-id" :style="{ '--cat-color': catInfo(selectedFarmer).color }">
                  <div class="id-header">
                    <img src="@/assets/images/mao-echague-logo.png" alt="MAO Logo" class="id-logo" onerror="this.style.display='none'" />
                    <div class="id-header-text">
                      <p class="gov-title">MUNICIPAL AGRICULTURE OFFICE</p>
                      <p class="gov-sub">Echague, Isabela · RSBSA</p>
                    </div>
                  </div>

                  <div v-if="isPriority(selectedFarmer)" class="priority-banner">
                    <span class="pb-star">★</span>
                    <span class="pb-text">PRIORITY ACCESS</span>
                    <span class="pb-sub">{{ priorityCategory(selectedFarmer) === 'pwd' ? 'Person with Disability' : 'Senior Citizen' }}</span>
                  </div>

                  <div class="id-body">
                    <div class="photo-section">
                      <div class="photo-box">
                        <img v-if="selectedFarmer.photo_path"
                          :src="`${API_BASE}/storage/${selectedFarmer.photo_path}`"
                          style="width:100%;height:100%;object-fit:cover;"
                        />
                        <ion-icon v-else :icon="personOutline" class="photo-icon"></ion-icon>
                      </div>
                      <div class="badge-role">REGISTERED FARMER</div>
                    </div>

                    <div class="details-section">
                      <div class="detail-group">
                        <span class="detail-label">FULL NAME</span>
                        <span class="detail-value name-value">
                          {{ selectedFarmer.first_name }}
                          {{ selectedFarmer.middle_name ? selectedFarmer.middle_name[0] + '.' : '' }}
                          {{ selectedFarmer.surname }}
                          {{ selectedFarmer.ext_name ? selectedFarmer.ext_name : '' }}
                        </span>
                      </div>

                      <div class="detail-group">
                        <span class="detail-label">RSBSA NUMBER</span>
                        <span class="detail-value highlight">{{ selectedFarmer.rsbsa_no || 'PENDING' }}</span>
                      </div>

                      <div class="detail-row">
                        <div class="detail-group">
                          <span class="detail-label">BARANGAY</span>
                          <span class="detail-value">{{ selectedFarmer.permanent_brgy }}</span>
                        </div>
                        <div class="detail-group">
                          <span class="detail-label">SEX</span>
                          <span class="detail-value">{{ selectedFarmer.sex }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="qr-section">
                      <qrcode-vue :value="selectedFarmer.id" :size="90" level="H" />
                      <p class="qr-label">Scan to Verify</p>
                    </div>
                  </div>

                  <div class="id-footer" :style="{ background: catInfo(selectedFarmer).color, color: '#fff' }">
                    <span>{{ isPriority(selectedFarmer) ? '★ ' : '' }}{{ catInfo(selectedFarmer).footer }}</span>
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
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent,
  IonList, IonItem, IonLabel, IonBadge, IonButton, IonIcon, IonSpinner,
  IonSearchbar, IonAvatar,
} from '@ionic/vue';
import { printOutline, personOutline, idCardOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import QrcodeVue from 'qrcode.vue';
import axiosInstance from '@/utils/axios';

const route = useRoute();
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://127.0.0.1:8000';

interface PaginationMeta { current_page: number; last_page: number; total: number; }

const farmers = ref<any[]>([]);
const selectedFarmer = ref<any>(null);
const isLoading = ref(true);
const pagination = ref<PaginationMeta | null>(null);
const searchQuery = ref('');

const fetchFarmers = async (page = 1, search = '') => {
  isLoading.value = true;
  try {
    const res = await axiosInstance.get('/farmers', { params: { page, search } });
    const payload = res.data.data;
    // Surface priority beneficiaries (PWD, then Senior) first within the page.
    const rank = (f: any) => (priorityCategory(f) === 'pwd' ? 0 : priorityCategory(f) === 'senior' ? 1 : 2);
    farmers.value = [...payload.data].sort((a, b) => rank(a) - rank(b));
    pagination.value = {
      current_page: payload.current_page,
      last_page: payload.last_page,
      total: payload.total,
    };

    // Auto-select if launched from FarmersListPage with a farmer_id query param
    const targetId = route.query.farmer_id as string | undefined;
    if (targetId && !selectedFarmer.value) {
      const match = farmers.value.find(f => f.id === targetId);
      if (match) selectedFarmer.value = match;
    }
  } catch {
    // silent
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = (ev: CustomEvent) => {
  searchQuery.value = (ev.detail as any).value ?? '';
  fetchFarmers(1, searchQuery.value);
};

const loadPage = (page: number) => fetchFarmers(page, searchQuery.value);

const selectFarmer = (farmer: any) => { selectedFarmer.value = farmer; };

const initials = (f: any) => ((f.first_name?.[0] ?? '') + (f.surname?.[0] ?? '')).toUpperCase();

const ageOf = (farmer: any): number | null => {
  if (!farmer?.birthdate) return null;
  const bd = new Date(farmer.birthdate);
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
};

type PriorityCategory = 'pwd' | 'senior' | 'regular';

// PWD takes precedence over senior when a farmer qualifies for both.
const priorityCategory = (farmer: any): PriorityCategory => {
  if (!farmer) return 'regular';
  if (farmer.is_pwd) return 'pwd';
  const age = ageOf(farmer);
  if (age !== null && age >= 60) return 'senior';
  return 'regular';
};

const CATEGORY: Record<PriorityCategory, { label: string; color: string; badge: string; footer: string }> = {
  pwd: { label: 'PWD', color: '#1d4ed8', badge: 'tertiary', footer: 'PRIORITY ACCESS — PERSON WITH DISABILITY' },
  senior: { label: 'SENIOR CITIZEN', color: '#b8860b', badge: 'warning', footer: 'PRIORITY ACCESS — SENIOR CITIZEN' },
  regular: { label: 'REGULAR', color: '#1a4731', badge: 'success', footer: 'OFFICIAL GOVERNMENT BENEFICIARY CARD' },
};

const catInfo = (farmer: any) => CATEGORY[priorityCategory(farmer)];

const isPriority = (farmer: any): boolean => priorityCategory(farmer) !== 'regular';

const printID = () => window.print();

onMounted(() => fetchFarmers());
</script>

<style scoped>
.auth-bg { --background: #f4f8f5; }
.issuance-container { max-width: 1200px; margin: 0 auto; padding-top: 1rem; padding-bottom: 2rem; }
.header-section h2 { font-weight: 800; color: #1a4731; margin: 0 0 4px; }
.text-muted { color: #6c757d; font-size: 0.9rem; }
.mb-4 { margin-bottom: 1.5rem; }
.mb-3 { margin-bottom: 1rem; }
.p-4 { padding: 1rem; }
.text-center { text-align: center; }

.list-card { border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; overflow: hidden; }
.list-search { border-bottom: 1px solid #e2e8f0; }
.selected-item { --background: #e8f5e9; }
.mono { font-family: monospace; font-size: 0.8rem; color: #64748b; }
.list-pagination { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px; border-top: 1px solid #e2e8f0; }
.page-label { font-size: 0.85rem; color: #64748b; font-weight: 600; }

.preview-col { display: flex; align-items: flex-start; justify-content: center; flex-direction: column; }
.empty-preview { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; background: #f1f5f9; border-radius: 12px; border: 2px dashed #cbd5e1; color: #94a3b8; gap: 1rem; width: 100%; }
.action-bar { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 500px; margin: 0 auto; }

/* ID Card */
.id-card { width: 500px; background: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #d1d5db; border-top: 6px solid var(--cat-color, #1a4731); font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.id-header { background: var(--cat-color, #1a4731); color: white; display: flex; align-items: center; padding: 14px 18px; }
.id-logo { width: 44px; height: 44px; margin-right: 14px; background: white; border-radius: 50%; padding: 2px; object-fit: contain; }
.id-header-text { display: flex; flex-direction: column; }
.gov-title { margin: 0; font-size: 13px; font-weight: 800; letter-spacing: 1px; }
.gov-sub { margin: 0; font-size: 10px; opacity: 0.85; letter-spacing: 1.5px; }
/* Gold PRIORITY ACCESS banner (Seniors / PWDs) */
.priority-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(90deg, #d4af37 0%, #f1c94b 50%, #d4af37 100%);
  color: #3a2f00;
  padding: 6px 18px;
  font-weight: 900;
  letter-spacing: 1.5px;
  border-bottom: 2px solid #b8860b;
  box-shadow: inset 0 -1px 2px rgba(0,0,0,0.15);
}
.priority-banner .pb-star { font-size: 15px; line-height: 1; }
.priority-banner .pb-text { font-size: 13px; }
.priority-banner .pb-sub {
  margin-left: auto;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background: rgba(58,47,0,0.12);
  padding: 2px 8px;
  border-radius: 3px;
}

.id-body { display: flex; padding: 16px 18px; gap: 16px; background: #fafafa; align-items: center; }
.photo-section { display: flex; flex-direction: column; align-items: center; width: 100px; flex-shrink: 0; }
.photo-box { width: 90px; height: 90px; background: #e2e8f0; border: 2px solid #cbd5e1; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; overflow: hidden; }
.photo-icon { font-size: 2.8rem; color: #94a3b8; }
.badge-role { font-size: 8px; font-weight: 800; background: var(--cat-color, #1a4731); color: white; padding: 3px 8px; border-radius: 4px; text-align: center; letter-spacing: 0.5px; }
.details-section { flex-grow: 1; }
.detail-group { display: flex; flex-direction: column; margin-bottom: 8px; }
.detail-row { display: flex; gap: 16px; }
.detail-label { font-size: 8px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; }
.detail-value { font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px; }
.name-value { font-size: 15px; font-weight: 800; text-transform: uppercase; }
.highlight { color: #1a4731; font-family: monospace; font-size: 14px; letter-spacing: 1px; font-weight: 700; }
.qr-section { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.qr-label { font-size: 8px; color: #64748b; margin: 0; font-weight: 600; }
.id-footer { background: #e2e8f0; color: #475569; text-align: center; padding: 7px; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }

.color-legend { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.75rem; font-size: 0.8rem; color: #475569; }
.legend-title { font-weight: 700; color: #1a4731; }
.legend-item { display: inline-flex; align-items: center; gap: 5px; }
.swatch { width: 14px; height: 14px; border-radius: 3px; display: inline-block; border: 1px solid rgba(0,0,0,0.1); }

@media print {
  body * { visibility: hidden; }
  body, .no-print-bg { background-color: white !important; }
  #printable-id, #printable-id * { visibility: visible; }
  #printable-id { position: absolute; left: 0; top: 0; width: 3.375in; height: 2.125in; transform: scale(1); border: none; box-shadow: none; }
  .no-print { display: none !important; }
}
</style>
