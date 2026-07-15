<template>
  <ion-page>
    <ion-header class="no-print">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Statutory Report Compiler</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="previewReport" :disabled="isLoading">
            <ion-icon slot="icon-only" :icon="refreshOutline"></ion-icon>
          </ion-button>
          <ion-button fill="clear" @click="printReport" :disabled="!report">
            <ion-icon slot="icon-only" :icon="printOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="report-bg ion-padding">
      <!-- Compiler Panel -->
      <div class="compiler-panel no-print">
        <h3 class="panel-title">Report Query Builder</h3>
        <div class="export-filters">
          <ion-select
            class="exp-filter"
            label="Report Type"
            label-placement="stacked"
            interface="popover"
            :value="filters.report_type"
            @ionChange="onReportTypeChange"
          >
            <ion-select-option v-for="t in reportTypes" :key="t" :value="t">{{ t }}</ion-select-option>
          </ion-select>
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
            :disabled="commodityLocked"
            @ionChange="(e: any) => filters.commodity = e.detail.value"
          >
            <ion-select-option :value="''">All commodities</ion-select-option>
            <ion-select-option v-for="c in commodities" :key="c" :value="c">{{ c }}</ion-select-option>
          </ion-select>
          <ion-input class="exp-filter" type="date" label="From" label-placement="stacked" :value="filters.date_from" @ionInput="(e: any) => filters.date_from = e.detail.value"></ion-input>
          <ion-input class="exp-filter" type="date" label="To" label-placement="stacked" :value="filters.date_to" @ionInput="(e: any) => filters.date_to = e.detail.value"></ion-input>
        </div>

        <div class="compiler-actions">
          <ion-button @click="previewReport" :disabled="isLoading">
            <ion-icon slot="start" :icon="eyeOutline"></ion-icon>
            Preview Report
          </ion-button>
          <ion-button fill="outline" @click="generateDraft" :disabled="isLoading || saving">
            <ion-icon slot="start" :icon="documentOutline"></ion-icon>
            {{ saving ? 'Saving…' : 'Generate Draft' }}
          </ion-button>
        </div>

        <div class="export-actions">
          <span class="export-label"><ion-icon :icon="downloadOutline"></ion-icon> Export CSV:</span>
          <ion-button size="small" fill="outline" @click="downloadCsv('farmers')">Farmers</ion-button>
          <ion-button size="small" fill="outline" @click="downloadCsv('distributions')">Distributions</ion-button>
          <ion-button size="small" fill="outline" @click="downloadCsv('damage')">Damage (PCIC)</ion-button>
          <ion-button size="small" fill="outline" @click="downloadCsv('accomplishment')">Accomplishment</ion-button>
        </div>
      </div>

      <!-- Workflow Ledger -->
      <div class="ledger-strip no-print">
        <div class="ledger-head">
          <h3 class="panel-title">Workflow Ledger</h3>
          <ion-button size="small" fill="clear" @click="loadLedger">
            <ion-icon slot="icon-only" :icon="refreshOutline"></ion-icon>
          </ion-button>
        </div>
        <div v-if="!workflows.length" class="ledger-empty">No drafts yet. Preview and generate a draft to start the MA review cycle.</div>
        <div class="ledger-list" v-else>
          <button
            v-for="w in workflows"
            :key="w.id"
            type="button"
            class="ledger-card"
            :class="{ active: activeWorkflow?.id === w.id }"
            @click="loadWorkflow(w.id)"
          >
            <span class="ledger-type">{{ shortType(w.report_type) }}</span>
            <span class="status-badge" :class="statusClass(w.provincial_status)">{{ w.provincial_status }}</span>
            <span class="ledger-meta">{{ formatLedgerDate(w.created_at) }}</span>
          </button>
        </div>
      </div>

      <!-- MA Workflow Actions -->
      <div class="workflow-actions no-print" v-if="activeWorkflow">
        <div class="wf-info">
          <strong>{{ activeWorkflow.report_type }}</strong>
          <span class="status-badge" :class="statusClass(activeWorkflow.provincial_status)">{{ activeWorkflow.provincial_status }}</span>
          <span class="wf-meta" v-if="activeWorkflow.collector">Collector: {{ activeWorkflow.collector.name }}</span>
        </div>
        <div class="wf-btns">
          <ion-button
            color="warning"
            :disabled="activeWorkflow.provincial_status !== 'Pending' || acting"
            @click="verifyReport"
          >
            Verify Report
          </ion-button>
          <ion-button
            color="success"
            :disabled="activeWorkflow.provincial_status !== 'Verified' || acting"
            @click="finalizeReport"
          >
            Approve &amp; Finalize
          </ion-button>
          <ion-button fill="outline" @click="clearWorkflow">Clear Selection</ion-button>
        </div>
      </div>

      <div class="report-wrapper" id="printable-report">
        <div v-if="isLoading" class="loading-center no-print">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Compiling report data...</p>
        </div>

        <StatutoryReportPrint
          v-else-if="report"
          :report="report"
          :collector-name="activeWorkflow?.collector?.name"
          :consolidator-name="activeWorkflow?.consolidator?.name"
          :submission-date="submissionLabel"
        />

        <div v-if="errorMsg" class="error-note no-print">{{ errorMsg }}</div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonButton,
  IonIcon, IonSpinner, IonSelect, IonSelectOption, IonInput, toastController,
} from '@ionic/vue';
import {
  refreshOutline, printOutline, downloadOutline, eyeOutline, documentOutline,
} from 'ionicons/icons';
import axiosInstance from '@/utils/axios';
import StatutoryReportPrint from '@/components/StatutoryReportPrint.vue';

const REPORT_TYPES = [
  'Provincial Accomplishment Report',
  'Palay Situation Report',
  'Corn Situation Report',
] as const;

const route = useRoute();
const router = useRouter();

const report = ref<any>(null);
const isLoading = ref(false);
const saving = ref(false);
const acting = ref(false);
const errorMsg = ref('');
const barangays = ref<string[]>([]);
const commodities = ref<string[]>([]);
const reportTypes = REPORT_TYPES;
const workflows = ref<any[]>([]);
const activeWorkflow = ref<any>(null);

const filters = reactive({
  report_type: 'Provincial Accomplishment Report' as string,
  barangay: '',
  commodity: '',
  date_from: '',
  date_to: '',
});

const commodityLocked = computed(() =>
  filters.report_type === 'Palay Situation Report' || filters.report_type === 'Corn Situation Report'
);

const submissionLabel = computed(() => {
  const d = activeWorkflow.value?.submission_date;
  if (!d) return '';
  return typeof d === 'string' ? d : String(d);
});

const toast = async (message: string, color = 'primary') => {
  const t = await toastController.create({ message, duration: 2400, color, position: 'top' });
  await t.present();
};

const filterPayload = () => ({
  report_type: filters.report_type,
  barangay: filters.barangay || null,
  commodity: filters.commodity || null,
  date_from: filters.date_from || null,
  date_to: filters.date_to || null,
});

const onReportTypeChange = (e: any) => {
  filters.report_type = e.detail.value;
  if (filters.report_type === 'Palay Situation Report') {
    filters.commodity = 'Rice';
  } else if (filters.report_type === 'Corn Situation Report') {
    filters.commodity = 'Corn';
  }
};

const previewReport = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const res = await axiosInstance.post('/report-workflows/preview', filterPayload());
    report.value = res.data.data;
    activeWorkflow.value = null;
  } catch {
    errorMsg.value = 'Failed to preview report. Please check filters and connection.';
  } finally {
    isLoading.value = false;
  }
};

const generateDraft = async () => {
  saving.value = true;
  try {
    const res = await axiosInstance.post('/report-workflows', filterPayload());
    const wf = res.data.data;
    report.value = wf.payload_snapshot;
    activeWorkflow.value = wf;
    await toast('Draft created (Pending).', 'success');
    await loadLedger();
    router.replace({ query: { workflow_id: wf.id } });
  } catch {
    await toast('Failed to create draft.', 'danger');
  } finally {
    saving.value = false;
  }
};

const loadLedger = async () => {
  try {
    const res = await axiosInstance.get('/report-workflows', { params: { per_page: 15 } });
    workflows.value = res.data?.data?.data ?? res.data?.data ?? [];
  } catch {
    // ledger optional on first load
  }
};

const applyWorkflow = (wf: any) => {
  activeWorkflow.value = wf;
  report.value = wf.payload_snapshot;
  filters.report_type = wf.report_type;
  const p = wf.report_parameters ?? {};
  filters.barangay = p.barangay ?? '';
  filters.commodity = p.commodity ?? '';
  filters.date_from = p.date_from ?? '';
  filters.date_to = p.date_to ?? '';
};

const loadWorkflow = async (id: string) => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    const res = await axiosInstance.get(`/report-workflows/${id}`);
    applyWorkflow(res.data.data);
    router.replace({ query: { workflow_id: id } });
  } catch {
    errorMsg.value = 'Failed to load workflow.';
  } finally {
    isLoading.value = false;
  }
};

const verifyReport = async () => {
  if (!activeWorkflow.value) return;
  acting.value = true;
  try {
    const res = await axiosInstance.patch(`/report-workflows/${activeWorkflow.value.id}/verify`);
    applyWorkflow(res.data.data);
    await toast('Report verified.', 'success');
    await loadLedger();
  } catch (e: any) {
    await toast(e?.response?.data?.message || 'Verify failed.', 'danger');
  } finally {
    acting.value = false;
  }
};

const finalizeReport = async () => {
  if (!activeWorkflow.value) return;
  acting.value = true;
  try {
    const res = await axiosInstance.patch(`/report-workflows/${activeWorkflow.value.id}/finalize`);
    applyWorkflow(res.data.data);
    await toast('Report finalized. Snapshot saved.', 'success');
    await loadLedger();
    setTimeout(() => window.print(), 400);
  } catch (e: any) {
    await toast(e?.response?.data?.message || 'Finalize failed.', 'danger');
  } finally {
    acting.value = false;
  }
};

const clearWorkflow = () => {
  activeWorkflow.value = null;
  router.replace({ query: {} });
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
    // optional
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

const shortType = (t: string) => {
  if (t.includes('Palay')) return 'Palay';
  if (t.includes('Corn')) return 'Corn';
  return 'Provincial';
};

const statusClass = (s: string) => {
  if (s === 'Finalized') return 'st-final';
  if (s === 'Verified') return 'st-verified';
  return 'st-pending';
};

const formatLedgerDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
};

onMounted(async () => {
  await loadFilters();
  await loadLedger();
  const wfId = route.query.workflow_id as string | undefined;
  if (wfId) {
    await loadWorkflow(wfId);
  } else {
    await previewReport();
  }
});
</script>

<style scoped>
.report-bg { --background: #f4f8f5; }
.report-wrapper { max-width: 1000px; margin: 0 auto; padding-bottom: 3rem; }

.compiler-panel, .ledger-strip, .workflow-actions {
  max-width: 1000px; margin: 0 auto 1.25rem; background: white; border: 1px solid #e2e8f0;
  border-radius: 12px; padding: 0.75rem 1rem;
}
.panel-title { margin: 0 0 0.75rem; font-size: 0.95rem; font-weight: 800; color: #1a4731; }
.export-filters { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.exp-filter { flex: 1; min-width: 140px; --background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 10px; }
.compiler-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.85rem; }
.export-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed #e2e8f0; }
.export-label { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; color: #1a4731; font-size: 0.85rem; }

.ledger-head { display: flex; justify-content: space-between; align-items: center; }
.ledger-empty { color: #94a3b8; font-size: 0.85rem; padding: 0.5rem 0; }
.ledger-list { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.25rem; }
.ledger-card {
  border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; padding: 0.55rem 0.75rem;
  display: flex; flex-direction: column; gap: 4px; min-width: 130px; cursor: pointer; text-align: left;
}
.ledger-card.active { border-color: #1a4731; background: #e8f5e9; }
.ledger-type { font-weight: 800; color: #1a4731; font-size: 0.85rem; }
.ledger-meta { font-size: 0.72rem; color: #94a3b8; }

.status-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; width: fit-content; }
.st-pending { background: #fff8e1; color: #e65100; }
.st-verified { background: #e3f2fd; color: #1565c0; }
.st-final { background: #e8f5e9; color: #2e7d32; }

.workflow-actions { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
.wf-info { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.wf-meta { font-size: 0.8rem; color: #64748b; }
.wf-btns { display: flex; gap: 0.4rem; flex-wrap: wrap; }

.loading-center { text-align: center; padding: 3rem; }
.error-note { background: #ffebee; color: #c0392b; padding: 12px; border-radius: 8px; text-align: center; font-weight: 600; }

@media print {
  .no-print { display: none !important; }
  ion-header { display: none; }
  .report-bg { --background: white; }
  .report-wrapper { max-width: 100%; padding: 0; }
}
</style>
