<template>
  <div id="support-qualified-print" class="support-doc" v-if="rows?.length">
    <div class="doc-header">
      <h1>Republic of the Philippines</h1>
      <h2>Province of Isabela</h2>
      <h2>Municipality of Echague</h2>
      <h3>Municipal Agriculture Office</h3>
      <h4 class="doc-title">Qualified Support Beneficiaries</h4>
      <p class="doc-meta">Generated: {{ generatedAt }} &middot; Total: {{ rows.length }} farmer(s)</p>
    </div>

    <table class="support-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Farmer</th>
          <th>Barangay</th>
          <th>Crop</th>
          <th>Area Destroyed (ha)</th>
          <th>Damage %</th>
          <th>Support Type</th>
          <th>Quantity</th>
          <th>Date Approved</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="i">
          <td class="ta-center">{{ i + 1 }}</td>
          <td>{{ row.farmer_name }}</td>
          <td>{{ row.barangay }}</td>
          <td>{{ row.crop_type }}</td>
          <td class="ta-center">{{ Number(row.area_destroyed_ha).toFixed(2) }}</td>
          <td class="ta-center">{{ row.damage_percentage }}%</td>
          <td>{{ row.support_type }}</td>
          <td class="ta-center">{{ row.quantity }} {{ row.unit }}</td>
          <td class="nowrap">{{ row.date_approved }}</td>
        </tr>
      </tbody>
    </table>

    <p class="footer-note">
      Support qty provisional MAO guideline; verify against current DA allocation.
    </p>

    <div class="sig-block">
      <div class="sig-line">
        <div class="sig-box"></div>
        <p>Municipal Agriculturist</p>
      </div>
      <div class="sig-line">
        <div class="sig-box"></div>
        <p>Prepared by (MAO Staff)</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  rows: Array<{
    farmer_name: string;
    barangay: string;
    crop_type: string;
    area_destroyed_ha: number;
    damage_percentage: number;
    support_type: string;
    quantity: number;
    unit: string;
    date_approved: string;
  }>;
  generatedAt: string;
}>();
</script>

<style scoped>
.support-doc {
  background: #fff;
  color: #111;
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
  font-family: 'Times New Roman', serif;
  font-size: 11pt;
}
.doc-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a4731; padding-bottom: 12px; }
.doc-header h1 { font-size: 11pt; margin: 0; font-weight: normal; }
.doc-header h2 { font-size: 12pt; margin: 2px 0; color: #1a4731; }
.doc-header h3 { font-size: 12pt; margin: 4px 0; font-weight: bold; }
.doc-title { font-size: 13pt; margin: 12px 0 4px; text-decoration: underline; }
.doc-meta { font-size: 10pt; color: #475569; margin: 0; }

.support-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 9pt; }
.support-table th {
  background: #1a4731;
  color: white;
  padding: 6px 8px;
  text-align: left;
  font-weight: 700;
}
.support-table td { padding: 5px 8px; border: 1px solid #ddd; }
.ta-center { text-align: center; }
.nowrap { white-space: nowrap; }

.footer-note {
  margin-top: 16px;
  font-size: 8pt;
  color: #64748b;
  font-style: italic;
  text-align: center;
}

.sig-block { display: flex; justify-content: space-around; margin-top: 40px; }
.sig-line { text-align: center; }
.sig-box { width: 180px; border-bottom: 1px solid #000; height: 40px; margin-bottom: 4px; }

@media print {
  .support-doc { padding: 0; max-width: 100%; }
  .support-table { font-size: 8pt; }
}
</style>
