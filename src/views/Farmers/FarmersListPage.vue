<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>RSBSA Registry</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="goToRegistration">
            <ion-icon slot="icon-only" :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar color="primary">
        <ion-searchbar
          placeholder="Search name, RSBSA no., barangay..."
          @ionInput="handleSearch"
          :debounce="450"
          style="--background:#fff;--color:#0f172a;"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="list-bg">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Filters / columns / export -->
      <div class="controls-bar">
        <div class="controls-row">
          <ion-select
            class="ctrl-filter"
            label="Barangay"
            label-placement="stacked"
            interface="popover"
            :value="filterBarangay"
            placeholder="All"
            @ionChange="onBarangayChange"
          >
            <ion-select-option :value="''">All barangays</ion-select-option>
            <ion-select-option v-for="b in barangays" :key="b" :value="b">{{ b }}</ion-select-option>
          </ion-select>
          <ion-button size="small" fill="solid" color="success" class="export-btn" @click="exportFarmers">
            <ion-icon slot="start" :icon="downloadOutline"></ion-icon>
            Export CSV
          </ion-button>
        </div>
        <div class="controls-row wrap">
          <ion-chip :class="{ off: !pwdOnly }" @click="pwdOnly = !pwdOnly">
            <ion-icon :icon="accessibilityOutline"></ion-icon> PWD only
          </ion-chip>
          <span class="col-label">Columns:</span>
          <ion-chip :class="{ off: !showCols.rsbsa }" @click="showCols.rsbsa = !showCols.rsbsa">RSBSA</ion-chip>
          <ion-chip :class="{ off: !showCols.address }" @click="showCols.address = !showCols.address">Address</ion-chip>
          <ion-chip :class="{ off: !showCols.plots }" @click="showCols.plots = !showCols.plots">Plots</ion-chip>
        </div>
      </div>

      <div v-if="farmerStore.isLoading" class="center-state">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Loading registry...</p>
      </div>

      <div v-else-if="farmerStore.error" class="center-state error">
        <ion-icon :icon="alertCircleOutline" size="large"></ion-icon>
        <p>{{ farmerStore.error }}</p>
        <ion-button @click="farmerStore.fetchFarmers()">Retry</ion-button>
      </div>

      <div v-else-if="displayedFarmers.length === 0" class="center-state">
        <ion-icon :icon="personAddOutline" size="large" color="medium"></ion-icon>
        <p v-if="pwdOnly">No PWD farmers on this page.</p>
        <p v-else>No farmers found. Tap <strong>+</strong> to enroll the first farmer.</p>
      </div>

      <ion-list v-else lines="full">
        <ion-item
          v-for="farmer in displayedFarmers"
          :key="farmer.id"
          button
          detail
          @click="openDetail(farmer)"
          class="farmer-item"
        >
          <ion-avatar slot="start" class="farmer-avatar">
            <img
              v-if="farmer.photo_path"
              :src="`${API_BASE}/storage/${farmer.photo_path}`"
              :alt="`${farmer.first_name} ${farmer.surname}`"
            />
            <div v-else class="avatar-initials">
              {{ initials(farmer) }}
            </div>
          </ion-avatar>

          <ion-label>
            <h2 class="farmer-name">{{ farmer.surname }}, {{ farmer.first_name }}
              <span v-if="farmer.ext_name"> {{ farmer.ext_name }}</span>
            </h2>
            <p v-if="showCols.rsbsa" class="farmer-rsbsa">{{ farmer.rsbsa_no || 'RSBSA pending' }}</p>
            <p v-if="showCols.address" class="farmer-meta">
              <ion-icon :icon="locationOutline" style="font-size:12px;vertical-align:middle;"></ion-icon>
              {{ farmer.permanent_brgy }}, {{ farmer.permanent_city }}
            </p>
          </ion-label>

          <div slot="end" class="item-end">
            <ion-badge v-if="showCols.plots" :color="(farmer.farm_plots_count ?? 0) > 0 ? 'success' : 'medium'">
              {{ farmer.farm_plots_count ?? 0 }} Plot{{ (farmer.farm_plots_count ?? 0) !== 1 ? 's' : '' }}
            </ion-badge>
            <ion-badge v-if="farmer.is_pwd" color="warning" class="mt-1">PWD</ion-badge>
          </div>
        </ion-item>
      </ion-list>

      <!-- Pagination -->
      <div v-if="farmerStore.pagination && farmerStore.pagination.last_page > 1" class="pagination-bar">
        <ion-button fill="outline" size="small"
          :disabled="farmerStore.pagination.current_page <= 1"
          @click="changePage(farmerStore.pagination.current_page - 1)">
          <ion-icon slot="icon-only" :icon="chevronBackOutline"></ion-icon>
        </ion-button>

        <span class="page-info">
          Page {{ farmerStore.pagination.current_page }} of {{ farmerStore.pagination.last_page }}
          &nbsp;·&nbsp; {{ farmerStore.pagination.total }} farmers
        </span>

        <ion-button fill="outline" size="small"
          :disabled="farmerStore.pagination.current_page >= farmerStore.pagination.last_page"
          @click="changePage(farmerStore.pagination.current_page + 1)">
          <ion-icon slot="icon-only" :icon="chevronForwardOutline"></ion-icon>
        </ion-button>
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button color="primary" @click="goToRegistration">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <!-- Farmer Detail Modal -->
    <ion-modal :is-open="isModalOpen" @didDismiss="isModalOpen = false">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-button @click="isModalOpen = false">
              <ion-icon slot="icon-only" :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
          <ion-title>Farmer Profile</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="goToIdIssuance(selectedFarmer)" fill="clear">
              <ion-icon slot="start" :icon="idCardOutline"></ion-icon>
              Print ID
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding detail-bg" v-if="selectedFarmer">
        <div class="detail-card">
          <div class="detail-avatar-row">
            <div class="detail-avatar">
              <img v-if="selectedFarmer.photo_path"
                :src="`${API_BASE}/storage/${selectedFarmer.photo_path}`" />
              <div v-else class="avatar-initials large">{{ initials(selectedFarmer) }}</div>
            </div>
            <div>
              <h2 class="detail-name">{{ selectedFarmer.first_name }} {{ selectedFarmer.middle_name ? selectedFarmer.middle_name[0] + '.' : '' }} {{ selectedFarmer.surname }}</h2>
              <ion-badge color="primary">{{ selectedFarmer.livelihood_type }}</ion-badge>
              <ion-badge v-if="selectedFarmer.is_pwd" color="warning" style="margin-left:6px;">PWD</ion-badge>
              <ion-badge v-if="selectedFarmer.is_4ps_beneficiary" color="secondary" style="margin-left:6px;">4Ps</ion-badge>
            </div>
          </div>

          <ion-list>
            <ion-item>
              <ion-label>
                <p class="lbl">RSBSA Number</p>
                <h3>{{ selectedFarmer.rsbsa_no || 'Pending issuance' }}</h3>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label>
                <p class="lbl">Address</p>
                <h3>{{ selectedFarmer.permanent_brgy }}, {{ selectedFarmer.permanent_city }}, {{ selectedFarmer.permanent_province }}</h3>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label>
                <p class="lbl">Contact</p>
                <h3>{{ selectedFarmer.mobile_number }}</h3>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label>
                <p class="lbl">Sex / Civil Status</p>
                <h3>{{ selectedFarmer.sex }} &middot; {{ selectedFarmer.civil_status }}</h3>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label>
                <p class="lbl">Education</p>
                <h3>{{ selectedFarmer.highest_education }}</h3>
              </ion-label>
            </ion-item>
          </ion-list>

          <h3 class="section-title">Farm Plots ({{ (selectedFarmer.farm_plots || []).length }})</h3>
          <ion-card v-for="plot in (selectedFarmer.farm_plots || [])" :key="plot.id" class="plot-card">
            <ion-card-content>
              <div class="plot-row">
                <div>
                  <strong>{{ plot.commodity }}</strong>
                  <p>{{ plot.size_ha }} ha &middot; {{ plot.location_brgy }}, {{ plot.location_city }}</p>
                  <p class="text-muted">{{ plot.farm_type }} &middot; {{ plot.ownership_type }}</p>
                </div>
                <ion-badge color="success">{{ plot.size_ha }} ha</ion-badge>
              </div>
            </ion-card-content>
          </ion-card>

          <h3 class="section-title">Subsidy Claims</h3>
          <div v-if="isLoadingDetail" class="ion-text-center"><ion-spinner></ion-spinner></div>
          <div v-else-if="!selectedFarmer.distributions?.length" class="empty-sub">No claims on record.</div>
          <ion-card v-for="d in (selectedFarmer.distributions || [])" :key="d.id" class="plot-card">
            <ion-card-content>
              <div class="plot-row">
                <div>
                  <strong>{{ d.program?.name }}</strong>
                  <p>{{ d.quantity_claimed }} {{ d.program?.unit_of_measurement }}</p>
                </div>
                <ion-badge color="primary">{{ d.program?.type }}</ion-badge>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      </ion-content>
    </ion-modal>

  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFarmerStore } from '@/stores/farmerStore';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonButton, IonSearchbar, IonSpinner,
  IonList, IonItem, IonLabel, IonAvatar, IonBadge, IonIcon,
  IonFab, IonFabButton, IonRefresher, IonRefresherContent,
  IonModal, IonCard, IonCardContent, IonSelect, IonSelectOption, IonChip,
  toastController,
} from '@ionic/vue';
import {
  addOutline, leafOutline, locationOutline, alertCircleOutline,
  personAddOutline, chevronBackOutline, chevronForwardOutline,
  closeOutline, idCardOutline, downloadOutline, accessibilityOutline,
} from 'ionicons/icons';
import apiClient from '@/utils/axios';

const router = useRouter();
const farmerStore = useFarmerStore();
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://127.0.0.1:8000';

const isModalOpen = ref(false);
const selectedFarmer = ref<any>(null);
const isLoadingDetail = ref(false);

const barangays = ref<string[]>([]);
const filterBarangay = ref('');
const pwdOnly = ref(false);
const showCols = reactive({ rsbsa: true, address: true, plots: true });

const displayedFarmers = computed(() =>
  pwdOnly.value ? farmerStore.farmers.filter((f: any) => f.is_pwd) : farmerStore.farmers
);

const toast = async (message: string, color = 'primary') => {
  const t = await toastController.create({ message, duration: 2400, color, position: 'top' });
  await t.present();
};

const loadBarangays = async () => {
  try {
    const res = await apiClient.get('/farmers/barangays');
    barangays.value = (res.data?.data ?? []).filter(Boolean);
  } catch {
    // optional
  }
};

const onBarangayChange = (e: CustomEvent) => {
  filterBarangay.value = (e.detail as any).value ?? '';
  // The registry index filters via the search term, which matches barangay.
  farmerStore.fetchFarmers(1, filterBarangay.value);
};

const exportFarmers = async () => {
  try {
    const params: Record<string, string> = {};
    if (filterBarangay.value) params.barangay = filterBarangay.value;
    const res = await apiClient.get('/reports/export/farmers', { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `agri-akap-farmers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    await toast('Farmer registry exported.', 'success');
  } catch {
    await toast('Export failed. Please try again.', 'danger');
  }
};

onMounted(() => {
  farmerStore.fetchFarmers();
  loadBarangays();
});

const handleSearch = (event: CustomEvent) => {
  const query = (event.detail as any).value ?? '';
  farmerStore.fetchFarmers(1, query);
};

const handleRefresh = async (event: CustomEvent) => {
  await farmerStore.fetchFarmers();
  (event.target as any).complete();
};

const changePage = (page: number) => farmerStore.fetchFarmers(page, '');

const goToRegistration = () => {
  const inTech = router.currentRoute.value.path.startsWith('/tech');
  router.push(inTech ? '/tech/farmers/register' : '/admin/farmers/register');
};

const goToIdIssuance = (farmer: any) => {
  isModalOpen.value = false;
  router.push({ name: 'IdIssuance', query: { farmer_id: farmer.id } });
};

const initials = (farmer: any): string => {
  const f = farmer.first_name?.[0] ?? '';
  const s = farmer.surname?.[0] ?? '';
  return (f + s).toUpperCase();
};

const openDetail = async (farmer: any) => {
  selectedFarmer.value = farmer;
  isModalOpen.value = true;

  if (!farmer.distributions) {
    isLoadingDetail.value = true;
    try {
      const res = await apiClient.get(`/farmers/${farmer.id}`);
      selectedFarmer.value = res.data.data;
    } catch {
      // keep partial data
    } finally {
      isLoadingDetail.value = false;
    }
  }
};
</script>

<style scoped>
.list-bg { --background: #f4f8f5; }
.controls-bar { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 0.6rem 0.9rem; }
.controls-row { display: flex; align-items: center; gap: 0.6rem; }
.controls-row.wrap { flex-wrap: wrap; margin-top: 0.5rem; }
.ctrl-filter { flex: 1; min-width: 140px; --background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 10px; }
.export-btn { flex-shrink: 0; }
.controls-bar ion-chip { --background: #eef2ff; font-weight: 600; font-size: 0.78rem; height: 28px; }
.controls-bar ion-chip.off { opacity: 0.4; }
.col-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; margin-left: 0.3rem; }
.center-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; color: var(--ion-color-medium); gap: 0.75rem; text-align: center; padding: 1rem; }
.center-state.error { color: var(--ion-color-danger); }

.farmer-item { --padding-start: 1rem; --inner-padding-end: 0.5rem; }
.farmer-avatar { width: 46px; height: 46px; background: #e8f5e9; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.farmer-avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-initials { font-weight: 800; color: #1a4731; font-size: 1.1rem; }
.avatar-initials.large { font-size: 2rem; }
.farmer-name { font-weight: 700; color: #0f172a; margin: 0; }
.farmer-rsbsa { font-size: 0.8rem; color: #64748b; margin: 2px 0 0; font-family: monospace; }
.farmer-meta { font-size: 0.8rem; color: #94a3b8; margin: 2px 0 0; }
.item-end { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.mt-1 { margin-top: 4px; }

.pagination-bar { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; }
.page-info { font-size: 0.85rem; color: #64748b; font-weight: 600; }

/* Detail modal */
.detail-bg { --background: #f4f8f5; }
.detail-card { max-width: 680px; margin: 0 auto; padding-bottom: 3rem; }
.detail-avatar-row { display: flex; align-items: center; gap: 1rem; padding: 1.5rem 0 1rem; }
.detail-avatar { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; background: #e8f5e9; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 3px solid #1a4731; }
.detail-avatar img { width: 100%; height: 100%; object-fit: cover; }
.detail-name { margin: 0 0 6px; font-weight: 800; color: #1a4731; font-size: 1.25rem; }
.lbl { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
.section-title { color: #1a4731; font-weight: 800; margin: 1.5rem 0 0.5rem; font-size: 1rem; border-bottom: 2px solid #e8f5e9; padding-bottom: 4px; }
.plot-card { border-radius: 10px; margin: 0 0 0.5rem; }
.plot-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.plot-row p { margin: 2px 0 0; font-size: 0.85rem; color: #64748b; }
.text-muted { color: #94a3b8 !important; }
.empty-sub { color: #94a3b8; text-align: center; padding: 1rem; font-size: 0.9rem; }
</style>
