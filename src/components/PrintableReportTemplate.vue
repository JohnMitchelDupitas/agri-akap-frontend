<template>
  <div id="executive-report-print" class="printable-report" v-if="rows.length">
    <header class="print-header">
      <div class="logo-row">
        <div class="logo-slot" aria-label="Bagong Pilipinas logo placeholder">
          <span class="logo-ph">Bagong Pilipinas</span>
        </div>
        <div class="header-text">
          <p class="gov-line">Republic of the Philippines</p>
          <p class="gov-line">Province of Isabela</p>
          <p class="gov-line">Municipality of Echague</p>
          <h1 class="office-title">MUNICIPAL AGRICULTURE OFFICE</h1>
        </div>
        <div class="logo-slot" aria-label="LGU Echague logo placeholder">
          <span class="logo-ph">LGU Echague</span>
        </div>
      </div>

      <h2 class="report-title">{{ printTitle }}</h2>
      <p class="report-meta" v-if="filterSummary">{{ filterSummary }}</p>
      <p class="report-meta">Generated: {{ generatedAt }}</p>
    </header>

    <table class="form-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in paddedRows" :key="i">
          <td
            v-for="col in columns"
            :key="col.key"
            :class="{ 'ta-center': col.center }"
          >
            {{ row ? displayCell(row, col.key, i) : '' }}
          </td>
        </tr>
      </tbody>
    </table>

    <p class="record-count">{{ rows.length }} record(s)</p>

    <footer class="print-footer">
      <div class="sig-col">
        <p class="sig-label">Prepared and Submitted by:</p>
        <div class="sig-line"></div>
        <p class="sig-name">{{ preparedBy || '________________________' }}</p>
        <p class="sig-title">MAO Admin / Data Encoder</p>
      </div>
      <div class="sig-col">
        <p class="sig-label">Certified correct by:</p>
        <div class="sig-line"></div>
        <p class="sig-name">{{ certifiedBy || '________________________' }}</p>
        <p class="sig-title">Municipal Agriculturist</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  columnsForCategory,
  REPORT_PRINT_TITLES,
  type ExecutiveReportCategory,
} from '@/constants/executiveReportingColumns';

const props = withDefaults(
  defineProps<{
    reportType: ExecutiveReportCategory;
    rows: Record<string, string | number>[];
    barangay?: string;
    cropType?: string;
    dateFrom?: string;
    dateTo?: string;
    preparedBy?: string;
    certifiedBy?: string;
  }>(),
  {
    barangay: '',
    cropType: '',
    dateFrom: '',
    dateTo: '',
    preparedBy: '',
    certifiedBy: 'Municipal Agriculturist',
  },
);

const columns = computed(() => columnsForCategory(props.reportType));
const printTitle = computed(() => REPORT_PRINT_TITLES[props.reportType]);

const generatedAt = computed(() =>
  new Date().toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }),
);

const filterSummary = computed(() => {
  const parts: string[] = [];
  if (props.barangay) parts.push(`Barangay: ${props.barangay}`);
  else parts.push('Barangay: All');
  if (props.cropType) parts.push(`Crop: ${props.cropType}`);
  if (props.dateFrom || props.dateTo) {
    parts.push(`Period: ${props.dateFrom || '…'} to ${props.dateTo || '…'}`);
  }
  return parts.join(' · ');
});

const paddedRows = computed(() => {
  const list = props.rows;
  const min = 18;
  if (list.length >= min) return list;
  return [...list, ...Array(min - list.length).fill(null)];
});

function displayCell(row: Record<string, string | number>, key: string, index: number): string | number {
  if (key === 'no') return index + 1;
  return row[key] ?? '';
}
</script>

<style scoped>
.printable-report {
  background: #fff;
  color: #000;
  padding: 12mm 10mm;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Times New Roman', Times, serif;
  font-size: 9pt;
}

.print-header {
  text-align: center;
  margin-bottom: 10px;
}

.logo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.logo-slot {
  width: 72px;
  height: 72px;
  border: 1px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-ph {
  font-size: 6pt;
  text-align: center;
  line-height: 1.2;
  padding: 4px;
}

.header-text {
  flex: 1;
}

.gov-line {
  margin: 0;
  font-size: 10pt;
}

.office-title {
  margin: 6px 0 0;
  font-size: 12pt;
  font-weight: bold;
}

.report-title {
  margin: 10px 0 4px;
  font-size: 11pt;
  font-weight: bold;
  text-transform: uppercase;
}

.report-meta {
  margin: 2px 0;
  font-size: 9pt;
}

.form-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 7.5pt;
  table-layout: fixed;
}

.form-table th,
.form-table td {
  border: 1px solid #000;
  padding: 2px 3px;
  vertical-align: top;
  word-wrap: break-word;
  height: 16px;
}

.form-table th {
  font-weight: bold;
  text-align: center;
  background: #fff;
}

.ta-center {
  text-align: center;
}

.record-count {
  text-align: right;
  font-size: 8pt;
  margin: 6px 0 0;
  font-weight: bold;
}

.print-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
  padding: 0 16px;
  gap: 24px;
}

.sig-col {
  flex: 1;
  max-width: 280px;
}

.sig-label {
  margin: 0 0 4px;
  font-size: 9pt;
  text-align: left;
}

.sig-line {
  border-bottom: 1px solid #000;
  height: 32px;
  margin-bottom: 4px;
}

.sig-name {
  margin: 0;
  font-weight: bold;
  font-size: 9pt;
  text-align: center;
}

.sig-title {
  margin: 2px 0 0;
  font-size: 9pt;
  text-align: center;
}

@media print {
  .printable-report {
    padding: 0;
    max-width: 100%;
  }

  @page {
    size: landscape;
    margin: 8mm;
  }
}
</style>
