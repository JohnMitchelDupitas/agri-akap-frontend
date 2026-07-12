<template>
  <ion-page>
    <ion-header class="no-print">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Accomplishment Report</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="fetchReport" :disabled="isLoading">
            <ion-icon slot="icon-only" :icon="refreshOutline"></ion-icon>
          </ion-button>
          <ion-button fill="clear" @click="printReport">
            <ion-icon slot="icon-only" :icon="printOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="report-bg ion-padding">
      <!-- Filters + CSV export (screen only) -->
      <div class="export-bar no-print">
        <div class="export-filters">
          <ion-select
            class="exp-filter"
            label="Barangay"
            label-placement="stacked"
            interface="popover"
            :value="filters.barangay"
            placeholder="All"
            @ionChange="(e: any) => filters.barangay = e.detail.value"
          >
            <ion-select-option :value="''">All barangays</ion-select-option>
            <ion-select-option v-for="b in barangays" :key="b" :value="b">{{ b }}</ion-select-option>
          </ion-select>
          <ion-select
            class="exp-filter"
            label="Commodity"
            label-placement="stacked"
            interface="popover"
            :value="filters.commodity"
            placeholder="All"
            @ionChange="(e: any) => filters.commodity = e.detail.value"
          >
            <ion-select-option :value="''">All commodities</ion-select-option>
            <ion-select-option v-for="c in commodities" :key="c" :value="c">{{ c }}</ion-select-option>
          </ion-select>
          <ion-input class="exp-filter" type="date" label="From" label-placement="stacked" :value="filters.date_from" @ionInput="(e: any) => filters.date_from = e.detail.value"></ion-input>
          <ion-input class="exp-filter" type="date" label="To" label-placement="stacked" :value="filters.date_to" @ionInput="(e: any) => filters.date_to = e.detail.value"></ion-input>
        </div>
        <div class="export-actions">
          <span class="export-label"><ion-icon :icon="downloadOutline"></ion-icon> Export CSV:</span>
          <ion-button size="small" fill="outline" @click="downloadCsv('farmers')">Farmers</ion-button>
          <ion-button size="small" fill="outline" @click="downloadCsv('distributions')">Distributions</ion-button>
          <ion-button size="small" fill="outline" @click="downloadCsv('damage')">Damage (PCIC)</ion-button>
          <ion-button size="small" fill="outline" @click="downloadCsv('accomplishment')">Accomplishment</ion-button>
        </div>
      </div>

      <div class="report-wrapper" id="printable-report">

        <!-- Cover -->
        <div class="report-cover">
          <div class="cover-logo">
            <img src="@/assets/images/mao-echague-logo.png" alt="MAO" class="cover-img" onerror="this.style.display='none'" />
          </div>
          <h1 class="cover-title">MUNICIPAL AGRICULTURE OFFICE</h1>
          <p class="cover-sub">Echague, Isabela</p>
          <h2 class="cover-report">Accomplishment Report</h2>
          <p class="cover-date">Generated: {{ report?.generated_at ?? '...' }}</p>
        </div>

        <div v-if="isLoading" class="loading-center no-print">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Compiling report data...</p>
        </div>

        <template v-else-if="report">

          <!-- Totals Summary -->
          <div class="section-block">
            <h3 class="section-title">Summary Statistics</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="sum-n">{{ report.totals?.farmers?.toLocaleString() }}</span>
                <span class="sum-l">Registered Farmers</span>
              </div>
              <div class="summary-item">
                <span class="sum-n">{{ report.totals?.programs }}</span>
                <span class="sum-l">Programs Created</span>
              </div>
              <div class="summary-item">
                <span class="sum-n">{{ report.totals?.distributions?.toLocaleString() }}</span>
                <span class="sum-l">Distributions</span>
              </div>
              <div class="summary-item">
                <span class="sum-n">{{ report.totals?.approved_damage_claims }}</span>
                <span class="sum-l">Approved Damage Claims</span>
              </div>
              <div class="summary-item highlight">
                <span class="sum-n">₱{{ Number(report.totals?.total_value_lost ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</span>
                <span class="sum-l">Total Value of Losses (Approved)</span>
              </div>
            </div>
          </div>

          <!-- Farmers by Barangay -->
          <div class="section-block">
            <h3 class="section-title">Farmer Distribution by Barangay</h3>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Barangay</th>
                  <th class="ta-right">No. of Farmers</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in report.farmers_by_barangay" :key="row.permanent_brgy">
                  <td>{{ row.permanent_brgy }}</td>
                  <td class="ta-right">{{ row.count }}</td>
                </tr>
                <tr class="total-row">
                  <td><strong>TOTAL</strong></td>
                  <td class="ta-right"><strong>{{ report.totals?.farmers }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Programs & Distribution -->
          <div class="section-block">
            <h3 class="section-title">Subsidy Programs & Distribution Summary</h3>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Program Name</th>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Funding</th>
                  <th class="ta-right">Total</th>
                  <th class="ta-right">Dispensed</th>
                  <th class="ta-right">Remaining</th>
                  <th class="ta-right">Beneficiaries</th>
                  <th class="ta-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in report.programs" :key="p.id">
                  <td><strong>{{ p.name }}</strong></td>
                  <td>{{ p.type }}</td>
                  <td class="nowrap">{{ p.start_date }} – {{ p.end_date }}</td>
                  <td class="nowrap">{{ p.funding_source }}</td>
                  <td class="ta-right">{{ p.total_quantity?.toLocaleString() }} {{ p.unit }}</td>
                  <td class="ta-right text-green">{{ p.dispensed?.toLocaleString() }} {{ p.unit }}</td>
                  <td class="ta-right">{{ p.remaining_quantity?.toLocaleString() }} {{ p.unit }}</td>
                  <td class="ta-right">{{ p.beneficiaries }}</td>
                  <td class="ta-center">
                    <span :class="p.is_active ? 'badge-active' : 'badge-closed'">
                      {{ p.is_active ? 'Active' : 'Closed' }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!report.programs?.length">
                  <td colspan="9" class="ta-center empty-row">No programs recorded.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pest Summary by Barangay -->
          <div class="section-block" v-if="report.pest_summary_by_barangay">
            <h3 class="section-title">Pest Outbreak Summary by Barangay</h3>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Barangay</th>
                  <th class="ta-right">Total Outbreaks</th>
                  <th class="ta-right">Active</th>
                  <th class="ta-right">Resolved</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, brgy) in report.pest_summary_by_barangay" :key="brgy">
                  <td>{{ row.barangay }}</td>
                  <td class="ta-right">{{ row.total_outbreaks }}</td>
                  <td class="ta-right text-danger">{{ row.active }}</td>
                  <td class="ta-right text-green">{{ row.resolved }}</td>
                </tr>
                <tr v-if="!Object.keys(report.pest_summary_by_barangay ?? {}).length">
                  <td colspan="4" class="ta-center empty-row">No pest outbreaks recorded.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Approved Damage Assessments (PCIC-style) -->
          <div class="section-block">
            <h3 class="section-title">Approved Damage Assessments (PCIC Reference)</h3>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Farmer</th>
                  <th>Barangay</th>
                  <th>Calamity</th>
                  <th>Date</th>
                  <th>Commodity</th>
                  <th class="ta-right">Area (ha)</th>
                  <th class="ta-right">Damage %</th>
                  <th class="ta-right">Est. Value Lost</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="da in report.damage_assessments" :key="da.id">
                  <td><strong>{{ da.farmer_name }}</strong></td>
                  <td>{{ da.barangay }}</td>
                  <td>{{ da.calamity_name }}</td>
                  <td class="nowrap">{{ da.date_of_calamity }}</td>
                  <td>{{ da.commodity }}</td>
                  <td class="ta-right">{{ da.area_ha }}</td>
                  <td class="ta-right">{{ da.damage_percentage }}%</td>
                  <td class="ta-right">₱{{ Number(da.estimated_value_lost ?? 0).toLocaleString() }}</td>
                </tr>
                <tr v-if="!report.damage_assessments?.length">
                  <td colspan="8" class="ta-center empty-row">No approved damage assessments.</td>
                </tr>
              </tbody>
            </table>
          </div>

        </template>

        <div v-if="errorMsg" class="error-note no-print">{{ errorMsg }}</div>

        <!-- Print signature block -->
        <div class="signature-block" v-if="report">
          <div class="sig-col">
            <div class="sig-line"></div>
            <p class="sig-name">Prepared by</p>
            <p class="sig-title">MAO Field Technician</p>
          </div>
          <div class="sig-col">
            <div class="sig-line"></div>
            <p class="sig-name">Certified Correct</p>
            <p class="sig-title">Municipal Agriculturist</p>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonButton,
  IonIcon, IonSpinner, IonSelect, IonSelectOption, IonInput, toastController,
} from '@ionic/vue';
import { refreshOutline, printOutline, downloadOutline } from 'ionicons/icons';
import axiosInstance from '@/utils/axios';

const report = ref<any>(null);
const isLoading = ref(true);
const errorMsg = ref('');

const barangays = ref<string[]>([]);
const commodities = ref<string[]>([]);
const filters = reactive({ barangay: '', commodity: '', date_from: '', date_to: '' });

const toast = async (message: string, color = 'primary') => {
  const t = await toastController.create({ message, duration: 2400, color, position: 'top' });
  await t.present();
};

const fetchReport = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const res = await axiosInstance.get('/dashboard/report');
    report.value = res.data.data;
  } catch {
    errorMsg.value = 'Failed to load report data. Please check your connection.';
  } finally {
    isLoading.value = false;
  }
};

const loadFilters = async () => {
  try {
    const [b, c] = await Promise.all([
      axiosInstance.get('/farmers/barangays'),
      axiosInstance.get('/farmers/commodities'),
    ]);
    barangays.value = (b.data?.data ?? []).filter(Boolean);
    commodities.value = (c.data?.data ?? []).filter(Boolean);
  } catch {
    // filters optional
  }
};

const downloadCsv = async (type: string) => {
  try {
    const params: Record<string, string> = {};
    if (filters.barangay) params.barangay = filters.barangay;
    if (filters.commodity) params.commodity = filters.commodity;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    const res = await axiosInstance.get(`/reports/export/${type}`, { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `agri-akap-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    await toast(`${type} report exported.`, 'success');
  } catch {
    await toast('Export failed. Please try again.', 'danger');
  }
};

const printReport = () => window.print();

onMounted(() => {
  fetchReport();
  loadFilters();
});
</script>

<style scoped>
.report-bg { --background: #f4f8f5; }
.report-wrapper { max-width: 1000px; margin: 0 auto; padding-bottom: 3rem; }

.export-bar { max-width: 1000px; margin: 0 auto 1.25rem; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem 1rem; }
.export-filters { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.exp-filter { flex: 1; min-width: 140px; --background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 10px; }
.export-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed #e2e8f0; }
.export-label { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; color: #1a4731; font-size: 0.85rem; }

.report-cover { text-align: center; padding: 2rem 1rem 2.5rem; background: white; border-radius: 12px; border: 2px solid #1a4731; margin-bottom: 2rem; }
.cover-logo { margin-bottom: 1rem; }
.cover-img { width: 80px; height: 80px; object-fit: contain; }
.cover-title { font-size: 1.2rem; font-weight: 900; color: #1a4731; margin: 0; letter-spacing: 1px; }
.cover-sub { color: #64748b; font-size: 0.9rem; margin: 4px 0 1rem; }
.cover-report { font-size: 1.5rem; font-weight: 900; color: #0f172a; margin: 0 0 4px; }
.cover-date { color: #94a3b8; font-size: 0.85rem; margin: 0; }

.loading-center { text-align: center; padding: 3rem; }

.section-block { background: white; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 1.5rem; overflow: hidden; }
.section-title { background: #1a4731; color: white; font-size: 0.9rem; font-weight: 800; letter-spacing: 0.5px; padding: 10px 16px; margin: 0; text-transform: uppercase; }

.summary-grid { display: flex; flex-wrap: wrap; gap: 1px; background: #e2e8f0; }
.summary-item { background: white; flex: 1; min-width: 150px; padding: 1.25rem; text-align: center; }
.summary-item.highlight { background: #e8f5e9; }
.sum-n { display: block; font-size: 1.8rem; font-weight: 900; color: #1a4731; }
.sum-l { display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

.report-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.report-table th { padding: 0.7rem 1rem; background: #f8fafc; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
.report-table td { padding: 0.7rem 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; }
.report-table tr:hover td { background: #f8fafc; }
.report-table tr:last-child td { border-bottom: none; }
.total-row td { background: #f0fdf4; font-weight: 700; }
.ta-right { text-align: right; }
.ta-center { text-align: center; }
.nowrap { white-space: nowrap; }
.text-green { color: #2e7d32; font-weight: 700; }
.text-danger { color: #c0392b; font-weight: 700; }
.empty-row { color: #94a3b8; padding: 1.5rem; }
.badge-active { background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 10px; font-size: 0.78rem; font-weight: 700; }
.badge-closed { background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 10px; font-size: 0.78rem; font-weight: 700; }

.signature-block { display: flex; justify-content: space-around; padding: 2rem 1rem; background: white; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 2rem; }
.sig-col { text-align: center; }
.sig-line { width: 200px; border-bottom: 2px solid #1a4731; margin-bottom: 6px; }
.sig-name { font-weight: 700; color: #0f172a; margin: 0; font-size: 0.9rem; }
.sig-title { color: #64748b; margin: 2px 0 0; font-size: 0.8rem; }

.error-note { background: #ffebee; color: #c0392b; padding: 12px; border-radius: 8px; text-align: center; font-weight: 600; }

@media print {
  .no-print { display: none !important; }
  ion-header { display: none; }
  .report-bg { --background: white; }
  .report-wrapper { max-width: 100%; padding: 0; }
  .report-cover, .section-block, .signature-block { break-inside: avoid; }
  .report-table { font-size: 0.75rem; }
  .report-table th, .report-table td { padding: 0.4rem 0.6rem; }
}
</style>
