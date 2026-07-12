<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>PCIC Claims &amp; Insurance</ion-title>
      </ion-toolbar>
      <ion-toolbar color="primary">
        <ion-segment v-model="activeTab" @ionChange="onTabChange">
          <ion-segment-button value="claims"><ion-label>Damage Claims</ion-label></ion-segment-button>
          <ion-segment-button value="enrollments"><ion-label>PCIC Enrollments</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="pcic-bg ion-padding">
      <div class="pcic-wrapper">

        <!-- DAMAGE CLAIMS LEDGER -->
        <template v-if="activeTab === 'claims'">
          <div class="tab-intro">
            <h2>Post-Calamity Claims Ledger</h2>
            <p>Prioritized queue of approved damage assessments awaiting PCIC notice filing.</p>
          </div>

          <div class="filter-row">
            <ion-segment v-model="claimsFilter" @ionChange="fetchClaims">
              <ion-segment-button value="unfiled"><ion-label>Unfiled</ion-label></ion-segment-button>
              <ion-segment-button value="Approved"><ion-label>Approved</ion-label></ion-segment-button>
              <ion-segment-button value="Claimed"><ion-label>Claimed</ion-label></ion-segment-button>
              <ion-segment-button value="Verified"><ion-label>Verified</ion-label></ion-segment-button>
            </ion-segment>
          </div>

          <div v-if="claimsLoading" class="loading-state"><ion-spinner name="crescent"></ion-spinner></div>

          <div v-else-if="!claims.length" class="empty-state">
            <ion-icon :icon="documentTextOutline"></ion-icon>
            <p>No {{ claimsFilter === 'unfiled' ? 'unfiled approved' : claimsFilter.toLowerCase() }} claims.</p>
          </div>

          <ion-card v-for="c in claims" :key="c.id" class="claim-card">
            <img v-if="c.photo_url" :src="c.photo_url" class="evidence-thumb" alt="Evidence" />
            <ion-card-content>
              <div class="card-head">
                <div>
                  <h3>{{ c.farmer?.first_name }} {{ c.farmer?.surname }}</h3>
                  <p class="sub">{{ c.farmer?.permanent_brgy }} &middot; {{ c.calamity_type || c.calamity_name }}</p>
                </div>
                <div class="badges">
                  <ion-badge :color="statusColor(c.status)">{{ c.status }}</ion-badge>
                  <ion-badge v-if="c.is_pcic_notice_filed" color="success">PCIC Filed</ion-badge>
                  <ion-badge v-else-if="c.status === 'Approved'" color="warning">Awaiting Filing</ion-badge>
                </div>
              </div>

              <div class="meta-grid">
                <span><strong>Damage:</strong> {{ c.damage_percentage }}%</span>
                <span><strong>Area Lost:</strong> {{ c.area_destroyed_ha ?? '—' }} ha</span>
                <span><strong>Stage:</strong> {{ c.crop_stage || '—' }}</span>
                <span><strong>Date:</strong> {{ formatDate(c.date_of_calamity) }}</span>
                <span><strong>Est. Loss:</strong> PHP {{ formatMoney(c.estimated_value_lost) }}</span>
              </div>

              <div class="action-row">
                <ion-button v-if="c.status === 'Verified'" size="small" color="success" @click="approveClaim(c)">
                  Approve Notice of Loss
                </ion-button>
                <ion-button v-if="c.status === 'Approved' && !c.is_pcic_notice_filed" size="small" color="primary" @click="fileNotice(c)">
                  File PCIC Notice
                </ion-button>
                <ion-button v-if="['Approved', 'Claimed'].includes(c.status)" size="small" fill="outline" @click="openPrint(c)">
                  Generate Notice of Claim
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        </template>

        <!-- PCIC ENROLLMENTS -->
        <template v-else>
          <div class="tab-intro">
            <h2>Pre-Calamity PCIC Enrollments</h2>
            <p>Enroll registered farmers before calamity season and export batch applications to PCIC.</p>
          </div>

          <div class="toolbar-row">
            <ion-searchbar v-model="enrollSearch" placeholder="Search farmer name or RSBSA..." @ionInput="debouncedFetchEnrollments"></ion-searchbar>
            <ion-button size="small" fill="outline" @click="exportEnrollments">
              <ion-icon slot="start" :icon="downloadOutline"></ion-icon>Export CSV
            </ion-button>
            <ion-button size="small" @click="openEnrollModal">
              <ion-icon slot="start" :icon="personAddOutline"></ion-icon>Enroll in PCIC
            </ion-button>
          </div>

          <div v-if="enrollLoading" class="loading-state"><ion-spinner name="crescent"></ion-spinner></div>

          <div v-else-if="!enrollments.length" class="empty-state">
            <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
            <p>No PCIC enrollments yet. Enroll a farmer to begin.</p>
          </div>

          <ion-card v-for="e in enrollments" :key="e.id" class="enroll-card">
            <ion-card-content>
              <div class="card-head">
                <div>
                  <h3>{{ e.farmer?.first_name }} {{ e.farmer?.surname }}</h3>
                  <p class="sub">{{ e.farmer?.rsbsa_no }} &middot; {{ e.farmer?.permanent_brgy }}</p>
                </div>
                <ion-badge :color="e.status === 'Active' ? 'success' : e.status === 'Submitted' ? 'primary' : 'medium'">{{ e.status }}</ion-badge>
              </div>
              <div class="meta-grid">
                <span><strong>Commodity:</strong> {{ e.commodity }}</span>
                <span><strong>Insured:</strong> {{ e.insured_area_ha }} ha</span>
                <span><strong>Season:</strong> {{ e.crop_season }}</span>
                <span><strong>Year:</strong> {{ e.coverage_year }}</span>
                <span><strong>Policy:</strong> {{ e.policy_reference || 'Pending' }}</span>
              </div>
            </ion-card-content>
          </ion-card>
        </template>
      </div>

      <!-- ENROLL MODAL -->
      <ion-modal :is-open="enrollOpen" @didDismiss="enrollOpen = false">
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Enroll in PCIC</ion-title>
            <ion-buttons slot="end"><ion-button @click="enrollOpen = false">Close</ion-button></ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item class="modal-input">
            <ion-input v-model="enrollForm.farmer_search" label="Search Farmer (name / RSBSA)" label-placement="floating" @ionInput="searchFarmersForEnroll"></ion-input>
          </ion-item>

          <ion-list v-if="farmerResults.length">
            <ion-item v-for="f in farmerResults" :key="f.id" button @click="selectFarmerForEnroll(f)">
              <ion-label>{{ f.first_name }} {{ f.surname }} — {{ f.rsbsa_no }} ({{ f.permanent_brgy }})</ion-label>
            </ion-item>
          </ion-list>

          <template v-if="enrollForm.farmer_id">
            <p class="selected-farmer">Selected: <strong>{{ enrollForm.farmer_name }}</strong></p>

            <ion-item class="modal-input">
              <ion-select v-model="enrollForm.farm_plot_id" label="Farm Plot (optional)" label-placement="floating">
                <ion-select-option :value="null">Farmer-level enrollment</ion-select-option>
                <ion-select-option v-for="p in enrollPlots" :key="p.id" :value="p.id">
                  {{ p.commodity }} — {{ p.size_ha }} ha
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item class="modal-input">
              <ion-input v-model="enrollForm.crop_season" label="Crop Season *" label-placement="floating" placeholder="e.g., 2026 Wet Season"></ion-input>
            </ion-item>

            <ion-item class="modal-input">
              <ion-input type="number" v-model="enrollForm.coverage_year" label="Coverage Year *" label-placement="floating"></ion-input>
            </ion-item>

            <ion-button expand="block" class="mt-3" :disabled="savingEnroll" @click="submitEnrollment">
              {{ savingEnroll ? 'Enrolling…' : 'Confirm Enrollment' }}
            </ion-button>
          </template>
        </ion-content>
      </ion-modal>

      <!-- PRINT MODAL -->
      <ion-modal :is-open="printOpen" @didDismiss="printOpen = false" class="print-modal">
        <ion-header class="no-print">
          <ion-toolbar color="primary">
            <ion-title>PCIC Notice of Claim</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="doPrint"><ion-icon slot="start" :icon="printOutline"></ion-icon>Print</ion-button>
              <ion-button @click="printOpen = false">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <PcicNoticePrint :data="printData" />
        </ion-content>
      </ion-modal>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonSegment, IonSegmentButton, IonLabel, IonCard, IonCardContent, IonBadge,
  IonButton, IonIcon, IonSpinner, IonModal, IonItem, IonInput, IonSelect,
  IonSelectOption, IonSearchbar, IonList, toastController, alertController,
} from '@ionic/vue';
import {
  documentTextOutline, downloadOutline, personAddOutline, shieldCheckmarkOutline, printOutline,
} from 'ionicons/icons';
import apiClient from '@/utils/axios';
import PcicNoticePrint from '@/components/PcicNoticePrint.vue';

const activeTab = ref<'claims' | 'enrollments'>('claims');
const claimsFilter = ref('unfiled');
const claims = ref<any[]>([]);
const claimsLoading = ref(false);

const enrollments = ref<any[]>([]);
const enrollLoading = ref(false);
const enrollSearch = ref('');

const enrollOpen = ref(false);
const savingEnroll = ref(false);
const farmerResults = ref<any[]>([]);
const enrollPlots = ref<any[]>([]);
const enrollForm = ref({
  farmer_id: '',
  farmer_name: '',
  farmer_search: '',
  farm_plot_id: null as string | null,
  crop_season: `${new Date().getFullYear()} Wet Season`,
  coverage_year: new Date().getFullYear(),
});

const printOpen = ref(false);
const printData = ref<any>(null);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const toast = async (message: string, color = 'primary') => {
  const t = await toastController.create({ message, duration: 2600, color, position: 'top' });
  await t.present();
};

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PH') : '—';
const formatMoney = (v: any) => {
  const n = Number(v);
  return isNaN(n) ? '0.00' : n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
};

const statusColor = (s: string) => {
  if (s === 'Claimed') return 'success';
  if (s === 'Approved') return 'primary';
  if (s === 'Verified') return 'secondary';
  if (s === 'Rejected') return 'danger';
  return 'warning';
};

const fetchClaims = async () => {
  claimsLoading.value = true;
  try {
    const params: any = { sort: 'date_of_calamity', dir: 'desc' };
    if (claimsFilter.value === 'unfiled') {
      params.priority = 'unfiled';
    } else {
      params.status = claimsFilter.value;
    }
    const res = await apiClient.get('/damage-assessments', { params });
    claims.value = res.data?.data?.data ?? res.data?.data ?? [];
  } catch {
    await toast('Failed to load claims ledger.', 'danger');
  } finally {
    claimsLoading.value = false;
  }
};

const fetchEnrollments = async () => {
  enrollLoading.value = true;
  try {
    const res = await apiClient.get('/pcic-enrollments', {
      params: { search: enrollSearch.value || undefined },
    });
    enrollments.value = res.data?.data?.data ?? res.data?.data ?? [];
  } catch {
    await toast('Failed to load enrollments.', 'danger');
  } finally {
    enrollLoading.value = false;
  }
};

const debouncedFetchEnrollments = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchEnrollments, 400);
};

const onTabChange = () => {
  if (activeTab.value === 'claims') fetchClaims();
  else fetchEnrollments();
};

const approveClaim = async (c: any) => {
  const alert = await alertController.create({
    header: 'Approve Notice of Loss',
    message: `Approve the damage assessment for ${c.farmer?.first_name} ${c.farmer?.surname}?`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Approve',
        handler: async () => {
          try {
            await apiClient.patch(`/damage-assessments/${c.id}/decide`, { decision: 'Approved' });
            await toast('Notice of loss approved.', 'success');
            fetchClaims();
          } catch (err: any) {
            await toast(err.response?.data?.message || 'Approval failed.', 'danger');
          }
        },
      },
    ],
  });
  await alert.present();
};

const fileNotice = async (c: any) => {
  const alert = await alertController.create({
    header: 'File PCIC Notice',
    message: `Mark this claim as filed with PCIC for ${c.farmer?.first_name} ${c.farmer?.surname}?`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'File Notice',
        handler: async () => {
          try {
            await apiClient.patch(`/damage-assessments/${c.id}/file-notice`);
            await toast('PCIC notice filed successfully.', 'success');
            fetchClaims();
          } catch (err: any) {
            await toast(err.response?.data?.message || 'Filing failed.', 'danger');
          }
        },
      },
    ],
  });
  await alert.present();
};

const openPrint = async (c: any) => {
  try {
    const res = await apiClient.get(`/damage-assessments/${c.id}/notice`);
    printData.value = res.data?.data;
    printOpen.value = true;
  } catch (err: any) {
    await toast(err.response?.data?.message || 'Could not load notice data.', 'danger');
  }
};

const doPrint = () => window.print();

const openEnrollModal = () => {
  enrollForm.value = {
    farmer_id: '',
    farmer_name: '',
    farmer_search: '',
    farm_plot_id: null,
    crop_season: `${new Date().getFullYear()} Wet Season`,
    coverage_year: new Date().getFullYear(),
  };
  farmerResults.value = [];
  enrollPlots.value = [];
  enrollOpen.value = true;
};

const searchFarmersForEnroll = async () => {
  const q = enrollForm.value.farmer_search.trim();
  if (q.length < 2) { farmerResults.value = []; return; }
  try {
    const res = await apiClient.get('/farmers', { params: { search: q, per_page: 8 } });
    farmerResults.value = res.data?.data?.data ?? res.data?.data ?? [];
  } catch { /* non-fatal */ }
};

const selectFarmerForEnroll = async (f: any) => {
  enrollForm.value.farmer_id = f.id;
  enrollForm.value.farmer_name = `${f.first_name} ${f.surname}`;
  farmerResults.value = [];
  try {
    const res = await apiClient.get(`/farmers/${f.id}`);
    const farmer = res.data?.data ?? f;
    enrollPlots.value = farmer.farm_plots ?? farmer.farmPlots ?? [];
  } catch {
    enrollPlots.value = [];
  }
};

const submitEnrollment = async () => {
  if (!enrollForm.value.farmer_id || !enrollForm.value.crop_season) return;
  savingEnroll.value = true;
  try {
    await apiClient.post('/pcic-enrollments', {
      farmer_id: enrollForm.value.farmer_id,
      farm_plot_id: enrollForm.value.farm_plot_id,
      crop_season: enrollForm.value.crop_season,
      coverage_year: Number(enrollForm.value.coverage_year),
    });
    await toast('Farmer enrolled in PCIC.', 'success');
    enrollOpen.value = false;
    fetchEnrollments();
  } catch (err: any) {
    await toast(err.response?.data?.message || 'Enrollment failed.', 'danger');
  } finally {
    savingEnroll.value = false;
  }
};

const exportEnrollments = async () => {
  try {
    const res = await apiClient.get('/pcic-enrollments/export', {
      params: { format: 'csv' },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pcic-enrollments-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    await toast('Export failed.', 'danger');
  }
};

onMounted(fetchClaims);
</script>

<style scoped>
.pcic-bg { --background: #f4f8f5; }
.pcic-wrapper { max-width: 1100px; margin: 0 auto; }
.tab-intro { margin-bottom: 1rem; }
.tab-intro h2 { color: #1a4731; font-weight: 800; margin: 0 0 4px; }
.tab-intro p { color: #64748b; font-size: 0.9rem; margin: 0; }
.filter-row, .toolbar-row { margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.toolbar-row ion-searchbar { flex: 1; min-width: 200px; --background: #fff; }
.loading-state, .empty-state { text-align: center; padding: 2rem; color: #64748b; }
.empty-state ion-icon { font-size: 2.5rem; color: #cbd5e1; }
.claim-card, .enroll-card { border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 12px; }
.evidence-thumb { width: 100%; max-height: 160px; object-fit: cover; }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.card-head h3 { margin: 0; color: #1a4731; font-weight: 800; font-size: 1.05rem; }
.sub { color: #64748b; font-size: 0.85rem; margin: 2px 0 0; }
.badges { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
.meta-grid { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 10px 0; font-size: 0.88rem; color: #334155; }
.action-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.modal-input { --background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 0.8rem; }
.selected-farmer { font-size: 0.9rem; color: #1a4731; margin: 8px 0; }
.mt-3 { margin-top: 1rem; }

@media print {
  .no-print { display: none !important; }
  ion-content { --background: white; }
}
</style>
