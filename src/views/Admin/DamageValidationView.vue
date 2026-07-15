<template>
  <ion-page>
    <ion-header class="no-print">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
        <ion-buttons slot="end" v-if="canApprove">
          <ion-button class="export-btn" @click="exportApprovedList" :disabled="exportLoading">
            <ion-icon slot="start" :icon="downloadOutline"></ion-icon>
            Export Approved List
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="validation-bg ion-padding">
      <div class="wrapper no-print">
        <div class="page-head">
          <h2>Consolidated Damage Ledger</h2>
          <p class="subtitle">
            Review technician-submitted damage reports. Endorse pending cases and approve eligible farmers for support distribution.
          </p>
        </div>

        <div class="filter-bar">
          <ion-select
            class="filter-select"
            label="Barangay"
            label-placement="stacked"
            interface="popover"
            :value="filters.barangay"
            @ionChange="onBarangayChange"
          >
            <ion-select-option value="">All Barangays</ion-select-option>
            <ion-select-option v-for="b in barangayOptions" :key="b" :value="b">{{ b }}</ion-select-option>
          </ion-select>

          <ion-select
            class="filter-select"
            label="Damage Level"
            label-placement="stacked"
            interface="popover"
            :value="filters.severity"
            @ionChange="(e: any) => filters.severity = e.detail.value"
          >
            <ion-select-option value="">All Levels</ion-select-option>
            <ion-select-option value="Low">Low</ion-select-option>
            <ion-select-option value="Moderate">Moderate</ion-select-option>
            <ion-select-option value="Severe">Severe</ion-select-option>
          </ion-select>

          <ion-select
            class="filter-select"
            label="Crop Type"
            label-placement="stacked"
            interface="popover"
            :value="filters.crop"
            @ionChange="onCropChange"
          >
            <ion-select-option value="">All Crops</ion-select-option>
            <ion-select-option v-for="c in cropOptions" :key="c" :value="c">{{ c }}</ion-select-option>
          </ion-select>

          <ion-select
            class="filter-select"
            label="Approval Status"
            label-placement="stacked"
            interface="popover"
            :value="filters.status"
            @ionChange="onStatusChange"
          >
            <ion-select-option value="">All Statuses</ion-select-option>
            <ion-select-option value="Pending">Pending</ion-select-option>
            <ion-select-option value="Verified">Verified</ion-select-option>
            <ion-select-option value="Approved">Approved</ion-select-option>
            <ion-select-option value="Rejected">Rejected</ion-select-option>
          </ion-select>

          <ion-button fill="outline" size="small" class="refresh-btn" @click="fetchList" :disabled="isLoading">
            <ion-icon slot="icon-only" :icon="refreshOutline"></ion-icon>
          </ion-button>
        </div>

        <div v-if="isLoading" class="loading-center">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Loading damage reports...</p>
        </div>

        <template v-else>
          <p class="record-count">{{ filteredReports.length }} record{{ filteredReports.length === 1 ? '' : 's' }}</p>

          <div class="table-wrap">
            <table class="ledger-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Farmer Name</th>
                  <th>Farm Address</th>
                  <th>Crop Type</th>
                  <th>Damage Severity</th>
                  <th>Area Damaged (ha)</th>
                  <th>Date Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!filteredReports.length">
                  <td colspan="9" class="empty-row">No damage reports match the current filters.</td>
                </tr>
                <tr v-for="(row, idx) in filteredReports" :key="row.id">
                  <td class="ta-center">{{ idx + 1 }}</td>
                  <td class="font-bold">{{ row.farmer_name }}</td>
                  <td>{{ row.barangay }}</td>
                  <td>{{ row.crop_type }}</td>
                  <td>
                    <span class="severity-badge" :class="severityClass(row.damage_percentage)">
                      {{ severityLabel(row.damage_percentage) }} ({{ row.damage_percentage }}%)
                    </span>
                  </td>
                  <td class="ta-center">{{ Number(row.area_destroyed_ha).toFixed(2) }}</td>
                  <td class="nowrap">{{ row.date_created }}</td>
                  <td>
                    <ion-badge :color="statusColor(row.status)">{{ row.status }}</ion-badge>
                  </td>
                  <td>
                    <ion-button size="small" class="review-btn" @click="openReview(row)">
                      Review
                    </ion-button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>

      <!-- Review Modal -->
      <ion-modal :is-open="modalOpen" @didDismiss="closeModal" class="no-print">
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Damage Report Details</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeModal">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding modal-content" v-if="selected">
          <section class="detail-section">
            <h4>Report Information</h4>
            <div class="detail-grid">
              <div class="detail-field">
                <span class="lbl">Status</span>
                <span class="val"><ion-badge :color="statusColor(selected.status)">{{ selected.status }}</ion-badge></span>
              </div>
              <div class="detail-field">
                <span class="lbl">Date Created</span>
                <span class="val">{{ selected.date_created }}</span>
              </div>
              <div class="detail-field">
                <span class="lbl">Calamity</span>
                <span class="val">{{ selected.calamity_type }} — {{ selected.calamity_name }}</span>
              </div>
              <div class="detail-field">
                <span class="lbl">Date of Calamity</span>
                <span class="val">{{ formatDate(selected.date_of_calamity) }}</span>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <h4>Farmer Information</h4>
            <div class="detail-grid">
              <div class="detail-field">
                <span class="lbl">Farmer Name</span>
                <span class="val">{{ selected.farmer_name }}</span>
              </div>
              <div class="detail-field">
                <span class="lbl">Full Address</span>
                <span class="val">{{ selected.farm_address }}</span>
              </div>
              <div class="detail-field">
                <span class="lbl">Contact Number</span>
                <span class="val">{{ selected.contact_number || 'N/A' }}</span>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <h4>Farm &amp; Damage Details</h4>
            <div class="detail-grid">
              <div class="detail-field">
                <span class="lbl">Crop Type</span>
                <span class="val">{{ selected.crop_type }}</span>
              </div>
              <div class="detail-field">
                <span class="lbl">Crop Stage</span>
                <span class="val">{{ selected.crop_stage || 'N/A' }}</span>
              </div>
              <div class="detail-field">
                <span class="lbl">Damage Severity</span>
                <span class="val">{{ severityLabel(selected.damage_percentage) }} ({{ selected.damage_percentage }}%)</span>
              </div>
              <div class="detail-field">
                <span class="lbl">Area Damaged</span>
                <span class="val">{{ Number(selected.area_destroyed_ha).toFixed(2) }} ha</span>
              </div>
              <div class="detail-field">
                <span class="lbl">Est. Value Lost</span>
                <span class="val">₱{{ Number(selected.estimated_value_lost).toLocaleString() }}</span>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <h4>Geotagged Photo Evidence</h4>
            <img v-if="selected.photo_url" :src="selected.photo_url" alt="Damage evidence" class="evidence-photo" />
            <p v-else class="muted">No photo evidence attached.</p>
            <p class="geo-line" v-if="selected.latitude && selected.longitude">
              <ion-icon :icon="locationOutline"></ion-icon>
              {{ Number(selected.latitude).toFixed(6) }}, {{ Number(selected.longitude).toFixed(6) }}
            </p>
            <p class="muted" v-else>No GPS coordinates recorded.</p>
          </section>

          <div class="modal-actions" v-if="selected.status === 'Pending' && canVerify">
            <ion-button color="secondary" expand="block" @click="verifyReport" :disabled="acting">
              <ion-icon slot="start" :icon="shieldCheckmarkOutline"></ion-icon>
              Pre-Assess &amp; Endorse to MAO
            </ion-button>
          </div>

          <div class="modal-actions" v-if="['Pending', 'Verified'].includes(selected.status) && canApprove">
            <ion-button color="success" expand="block" @click="decide('Approved')" :disabled="acting">
              <ion-icon slot="start" :icon="checkmarkCircleOutline"></ion-icon>
              Approve
            </ion-button>
            <ion-button color="danger" fill="outline" expand="block" @click="decide('Rejected')" :disabled="acting">
              <ion-icon slot="start" :icon="closeCircleOutline"></ion-icon>
              Reject
            </ion-button>
          </div>

          <p v-if="!canActOnSelected" class="already-decided">
            This report has already been {{ selected.status.toLowerCase() }}.
          </p>
        </ion-content>
      </ion-modal>

      <!-- Print region (hidden on screen, shown on print) -->
      <div class="print-only">
        <SupportQualifiedListPrint
          v-if="printRows.length"
          :rows="printRows"
          :generated-at="printGeneratedAt"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonButton, IonIcon, IonBadge, IonSelect, IonSelectOption, IonModal, IonSpinner,
  toastController, alertController,
} from '@ionic/vue';
import {
  downloadOutline, locationOutline, checkmarkCircleOutline, closeCircleOutline,
  shieldCheckmarkOutline, refreshOutline,
} from 'ionicons/icons';
import apiClient from '@/utils/axios';
import { useAuthStore } from '@/stores/authStore';
import SupportQualifiedListPrint from '@/components/SupportQualifiedListPrint.vue';
import { supportAllocation } from '@/utils/supportAllocation';

export type ValidationStatus = 'Pending' | 'Verified' | 'Approved' | 'Rejected';

export interface DamageValidationReport {
  id: string;
  farmer_name: string;
  barangay: string;
  farm_address: string;
  contact_number: string;
  crop_type: string;
  crop_stage: string;
  calamity_type: string;
  calamity_name: string;
  date_of_calamity: string;
  damage_percentage: number;
  area_destroyed_ha: number;
  estimated_value_lost: number;
  date_created: string;
  date_approved: string;
  status: ValidationStatus;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

const authStore = useAuthStore();
const canVerify = computed(() => ['barangay_official', 'admin'].includes(authStore.userRole || ''));
const canApprove = computed(() => authStore.userRole === 'admin');
const pageTitle = computed(() => (canApprove.value ? 'Damage Validation' : 'Damage Review'));

const reports = ref<DamageValidationReport[]>([]);
const isLoading = ref(true);
const acting = ref(false);
const exportLoading = ref(false);
const barangayOptions = ref<string[]>([]);
const cropOptions = ref<string[]>([]);

const filters = reactive({
  barangay: '',
  severity: '',
  crop: '',
  status: authStore.userRole === 'barangay_official' ? 'Pending' : '',
});

const modalOpen = ref(false);
const selected = ref<DamageValidationReport | null>(null);
const printRows = ref<any[]>([]);
const printGeneratedAt = ref('');

const canActOnSelected = computed(() => {
  if (!selected.value) return false;
  if (selected.value.status === 'Pending' && (canVerify.value || canApprove.value)) return true;
  if (selected.value.status === 'Verified' && canApprove.value) return true;
  return false;
});

const mapAssessment = (a: any): DamageValidationReport => {
  const farmer = a.farmer || {};
  const plot = a.farm_plot || a.farmPlot || {};
  const brgy = farmer.permanent_brgy || plot.location_brgy || '-';
  return {
    id: a.id,
    farmer_name: `${farmer.first_name || ''} ${farmer.surname || ''}`.trim() || 'Unknown',
    barangay: brgy,
    farm_address: `${plot.location_brgy || brgy}, Echague, Isabela`,
    contact_number: farmer.mobile_number || '',
    crop_type: plot.commodity || '-',
    crop_stage: a.crop_stage || '',
    calamity_type: a.calamity_type || '-',
    calamity_name: a.calamity_name || '-',
    date_of_calamity: a.date_of_calamity || '',
    damage_percentage: Number(a.damage_percentage) || 0,
    area_destroyed_ha: Number(a.area_destroyed_ha ?? plot.size_ha) || 0,
    estimated_value_lost: Number(a.estimated_value_lost) || 0,
    date_created: a.created_at ? new Date(a.created_at).toLocaleDateString() : '-',
    date_approved: a.approved_at ? new Date(a.approved_at).toLocaleDateString() : '-',
    status: a.status,
    photo_url: a.photo_url || null,
    latitude: a.latitude != null ? Number(a.latitude) : null,
    longitude: a.longitude != null ? Number(a.longitude) : null,
  };
};

const toast = async (message: string, color = 'primary') => {
  const t = await toastController.create({ message, duration: 2400, color, position: 'top' });
  await t.present();
};

const loadFilterOptions = async () => {
  try {
    const [b, c] = await Promise.all([
      apiClient.get('/farmers/barangays'),
      apiClient.get('/farmers/commodities'),
    ]);
    barangayOptions.value = (b.data?.data ?? []).filter(Boolean);
    cropOptions.value = (c.data?.data ?? []).filter(Boolean);
  } catch {
    // optional
  }
};

const fetchList = async () => {
  isLoading.value = true;
  try {
    const params: Record<string, string | number> = { per_page: 50 };
    if (filters.status) params.status = filters.status;
    if (filters.barangay) params.barangay = filters.barangay;
    if (filters.crop) params.commodity = filters.crop;
    const res = await apiClient.get('/damage-assessments', { params });
    const rows = res.data?.data?.data ?? [];
    reports.value = rows.map(mapAssessment);
  } catch {
    await toast('Failed to load damage assessments.', 'danger');
    reports.value = [];
  } finally {
    isLoading.value = false;
  }
};

const onBarangayChange = (e: any) => {
  filters.barangay = e.detail.value;
  fetchList();
};
const onCropChange = (e: any) => {
  filters.crop = e.detail.value;
  fetchList();
};
const onStatusChange = (e: any) => {
  filters.status = e.detail.value;
  fetchList();
};

const severityLabel = (pct: number): string => {
  if (pct < 30) return 'Low';
  if (pct <= 60) return 'Moderate';
  return 'Severe';
};

const severityClass = (pct: number) => {
  const s = severityLabel(pct);
  return s === 'Severe' ? 'sev-severe' : s === 'Moderate' ? 'sev-mod' : 'sev-low';
};

const statusColor = (status: string) => {
  if (status === 'Approved') return 'success';
  if (status === 'Rejected') return 'danger';
  if (status === 'Verified') return 'secondary';
  return 'warning';
};

const filteredReports = computed(() =>
  reports.value.filter((r) => {
    if (filters.severity && severityLabel(r.damage_percentage) !== filters.severity) return false;
    return true;
  })
);

const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString() : '-');

const openReview = (row: DamageValidationReport) => {
  selected.value = row;
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
  selected.value = null;
};

const promptRemarks = async (header: string): Promise<string | null> =>
  new Promise(async (resolve) => {
    const alert = await alertController.create({
      header,
      inputs: [{ name: 'remarks', type: 'textarea', placeholder: 'Remarks (optional)' }],
      buttons: [
        { text: 'Cancel', role: 'cancel', handler: () => resolve(null) },
        { text: 'Confirm', handler: (d) => resolve(d.remarks || '') },
      ],
    });
    await alert.present();
  });

const verifyReport = async () => {
  if (!selected.value) return;
  const remarks = await promptRemarks('Pre-Assess Damage');
  if (remarks === null) return;
  acting.value = true;
  try {
    await apiClient.patch(`/damage-assessments/${selected.value.id}/verify`, { remarks });
    await toast('Endorsed to MAO for approval.', 'success');
    closeModal();
    await fetchList();
  } catch (e: any) {
    await toast(e.response?.data?.message || 'Action failed.', 'danger');
  } finally {
    acting.value = false;
  }
};

const decide = async (decision: 'Approved' | 'Rejected') => {
  if (!selected.value) return;
  const remarks = await promptRemarks(`${decision} Assessment`);
  if (remarks === null) return;
  acting.value = true;
  try {
    await apiClient.patch(`/damage-assessments/${selected.value.id}/decide`, { decision, remarks });
    await toast(`Assessment ${decision.toLowerCase()}.`, decision === 'Approved' ? 'success' : 'medium');
    closeModal();
    await fetchList();
  } catch (e: any) {
    await toast(e.response?.data?.message || 'Action failed.', 'danger');
  } finally {
    acting.value = false;
  }
};

const exportApprovedList = async () => {
  exportLoading.value = true;
  try {
    const res = await apiClient.get('/damage-assessments', {
      params: { status: 'Approved', per_page: 100 },
    });
    const approved = (res.data?.data?.data ?? []).map(mapAssessment);
    if (!approved.length) {
      await toast('No approved reports to export yet.', 'warning');
      return;
    }
    printGeneratedAt.value = new Date().toLocaleString();
    printRows.value = approved.map((r: DamageValidationReport) => {
      const alloc = supportAllocation(r.crop_type, r.area_destroyed_ha);
      return {
        farmer_name: r.farmer_name,
        barangay: r.barangay,
        crop_type: r.crop_type,
        area_destroyed_ha: r.area_destroyed_ha,
        damage_percentage: r.damage_percentage,
        support_type: alloc.support_type,
        quantity: alloc.quantity,
        unit: alloc.unit,
        date_approved: r.date_approved,
      };
    });
    await toast(`Printing ${approved.length} approved beneficiary record(s)...`, 'success');
    setTimeout(() => window.print(), 350);
  } catch {
    await toast('Failed to load approved list for export.', 'danger');
  } finally {
    exportLoading.value = false;
  }
};

onMounted(async () => {
  await loadFilterOptions();
  await fetchList();
});
</script>

<style scoped>
.validation-bg { --background: #f4f8f5; }
.wrapper { max-width: 1200px; margin: 0 auto; padding-bottom: 2rem; }

.page-head { margin-bottom: 1rem; }
.page-head h2 { margin: 0 0 4px; font-weight: 800; color: #1a4731; }
.subtitle { margin: 0; color: #64748b; font-size: 0.9rem; }

.export-btn {
  --background: #d4af37;
  --color: #1a4731;
  --border-radius: 8px;
  font-weight: 700;
  text-transform: none;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}
.filter-select {
  flex: 1;
  min-width: 140px;
  --background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0 10px;
}
.refresh-btn { margin-bottom: 4px; }

.loading-center { text-align: center; padding: 3rem; color: #1a4731; font-weight: 600; }

.record-count {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 0.5rem;
}

.table-wrap {
  overflow-x: auto;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.ledger-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  min-width: 900px;
}
.ledger-table thead th {
  background: #1a4731;
  color: white;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 0.4px;
  padding: 0.85rem 0.75rem;
  text-align: left;
  white-space: nowrap;
}
.ledger-table tbody td {
  padding: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}
.ledger-table tbody tr:nth-child(even) td { background: #f8fafc; }
.ledger-table tbody tr:hover td { background: #eef7f0; }
.empty-row { text-align: center; color: #94a3b8; padding: 2rem !important; }
.ta-center { text-align: center; }
.font-bold { font-weight: 700; color: #0f172a; }
.nowrap { white-space: nowrap; }

.severity-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
}
.sev-low { background: #e8f5e9; color: #2e7d32; }
.sev-mod { background: #fff8e1; color: #e65100; }
.sev-severe { background: #ffebee; color: #c0392b; }

.review-btn {
  --background: #1a4731;
  --color: white;
  --border-radius: 6px;
  font-weight: 700;
  text-transform: none;
  margin: 0;
}

.modal-content { --background: #f8fafc; }
.detail-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}
.detail-section h4 {
  margin: 0 0 0.75rem;
  color: #1a4731;
  font-size: 0.95rem;
  font-weight: 800;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 6px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.detail-field {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
}
.lbl { display: block; font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
.val { display: block; font-size: 0.9rem; color: #0f172a; font-weight: 600; }

.evidence-photo {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}
.geo-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 0.5rem;
  color: #1a4731;
  font-weight: 600;
  font-size: 0.85rem;
}
.muted { color: #94a3b8; font-style: italic; }

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-bottom: 1.5rem;
}
.already-decided {
  text-align: center;
  color: #64748b;
  font-weight: 600;
  padding: 1rem;
}

.print-only { display: none; }

@media print {
  .no-print { display: none !important; }
  ion-header { display: none !important; }
  .validation-bg { --background: white; }
  .wrapper { display: none; }
  .print-only { display: block !important; }
}

@media (max-width: 640px) {
  .detail-grid { grid-template-columns: 1fr; }
  .export-btn { font-size: 0.75rem; }
}
</style>
