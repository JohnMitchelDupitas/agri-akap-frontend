<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Predictive Analytics</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="loadAll" :disabled="isLoading">
            <ion-icon slot="icon-only" :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="analytics-bg ion-padding">
      <div class="wrapper">
        <div v-if="isLoading" class="ion-text-center loading"><ion-spinner name="crescent"></ion-spinner></div>

        <template v-else>
          <!-- Insights -->
          <ion-card class="insight-card">
            <ion-card-content>
              <div class="insight-head">
                <ion-icon :icon="bulbOutline"></ion-icon>
                <h2>Data-Driven Insights</h2>
              </div>
              <ul class="insight-list">
                <li v-for="(msg, i) in insights" :key="i">{{ msg }}</li>
                <li v-if="!insights.length">Not enough historical data yet. Keep logging crop cycles and yields in Field Intelligence.</li>
              </ul>
            </ion-card-content>
          </ion-card>

          <!-- Yield forecast per commodity -->
          <h3 class="section-title"><ion-icon :icon="trendingUpOutline"></ion-icon> Crop Yield Forecast</h3>
          <div v-if="!commodities.length" class="empty">No crop-yield history recorded yet.</div>

          <ion-card v-for="c in commodities" :key="c.commodity" class="chart-card">
            <ion-card-content>
              <div class="chart-head">
                <h4>{{ c.commodity }}</h4>
                <ion-badge v-if="c.forecast" :color="confidenceColor(c.forecast.confidence)">
                  {{ c.forecast.trend }} · {{ c.forecast.confidence }} confidence
                </ion-badge>
              </div>

              <div v-if="c.forecast" class="forecast-summary">
                <div class="fc-item">
                  <span class="fc-label">Projected {{ c.forecast.year }}</span>
                  <span class="fc-value">{{ fmt(c.forecast.projected_yield_kg) }} kg</span>
                </div>
                <div class="fc-item">
                  <span class="fc-label">Fit (R²)</span>
                  <span class="fc-value">{{ c.forecast.r_squared }}</span>
                </div>
              </div>
              <p v-else class="note">{{ c.note }}</p>

              <div class="chart-box">
                <Line :data="chartData(c)" :options="lineOptions" />
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Risk index -->
          <h3 class="section-title"><ion-icon :icon="warningOutline"></ion-icon> Agricultural Risk Index</h3>
          <div v-if="!riskItems.length" class="empty">No damage or pest history to score risk yet.</div>

          <ion-card v-else class="chart-card">
            <ion-card-content>
              <div class="risk-row risk-header">
                <span class="col-brgy">Barangay</span>
                <span class="col-com">Commodity</span>
                <span class="col-num">Damage</span>
                <span class="col-num">Pests</span>
                <span class="col-score">Risk</span>
              </div>
              <div class="risk-row" v-for="(r, i) in riskItems" :key="i">
                <span class="col-brgy">{{ r.barangay }}</span>
                <span class="col-com">{{ r.commodity }}</span>
                <span class="col-num">{{ r.avg_damage }}% <small>({{ r.damage_events }})</small></span>
                <span class="col-num">{{ r.active_pests }}</span>
                <span class="col-score">
                  <ion-badge :color="riskColor(r.risk_level)">{{ r.risk_score }} · {{ r.risk_level }}</ion-badge>
                </span>
              </div>
              <p class="formula">{{ riskFormula }}</p>
            </ion-card-content>
          </ion-card>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonButton, IonIcon, IonSpinner, IonCard, IonCardContent, IonBadge, toastController,
} from '@ionic/vue';
import { refreshOutline, bulbOutline, trendingUpOutline, warningOutline } from 'ionicons/icons';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import apiClient from '@/utils/axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const isLoading = ref(true);
const commodities = ref<any[]>([]);
const riskItems = ref<any[]>([]);
const riskFormula = ref('');

const fmt = (v: any) => (v == null ? '-' : Number(v).toLocaleString('en-PH'));

const toast = async (message: string, color = 'primary') => {
  const t = await toastController.create({ message, duration: 2200, color, position: 'top' });
  await t.present();
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom' as const },
    tooltip: { mode: 'index' as const, intersect: false },
  },
  scales: {
    y: { beginAtZero: true, title: { display: true, text: 'Yield (kg)' } },
    x: { title: { display: true, text: 'Year' } },
  },
};

const chartData = (c: any) => {
  const years = (c.history ?? []).map((h: any) => h.year);
  const yields = (c.history ?? []).map((h: any) => h.total_yield_kg);
  const labels = [...years];
  const actual = [...yields];
  const forecastSeries: (number | null)[] = years.map(() => null);

  if (c.forecast && years.length) {
    labels.push(c.forecast.year);
    actual.push(null);
    // connect last actual point to the projected point (dashed)
    forecastSeries.push(null); // placeholder, will be overwritten below
    forecastSeries[years.length - 1] = yields[yields.length - 1];
    forecastSeries[years.length] = c.forecast.projected_yield_kg;
  }

  return {
    labels,
    datasets: [
      {
        label: 'Actual yield',
        data: actual,
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22,163,74,0.12)',
        fill: true,
        tension: 0.25,
        spanGaps: false,
      },
      {
        label: 'Forecast',
        data: forecastSeries,
        borderColor: '#f59e0b',
        borderDash: [6, 4],
        backgroundColor: 'transparent',
        pointStyle: 'rectRot',
        tension: 0,
        spanGaps: true,
      },
    ],
  };
};

const insights = computed(() => {
  const out: string[] = [];
  for (const c of commodities.value) {
    if (c.forecast) {
      out.push(
        `${c.commodity} yield is trending ${c.forecast.trend}; projected ~${fmt(c.forecast.projected_yield_kg)} kg for ${c.forecast.year} (${c.forecast.confidence.toLowerCase()} confidence).`
      );
    }
  }
  const high = riskItems.value.filter((r) => r.risk_level === 'High');
  if (high.length) {
    const top = high[0];
    out.push(
      `Highest agricultural risk: Brgy ${top.barangay} (${top.commodity}) at ${top.risk_score}/100. ${high.length} area(s) flagged High — prioritize monitoring and advisories.`
    );
  }
  return out;
});

const confidenceColor = (c: string) => (c === 'High' ? 'success' : c === 'Moderate' ? 'warning' : 'medium');
const riskColor = (level: string) => (level === 'High' ? 'danger' : level === 'Moderate' ? 'warning' : 'success');

const loadAll = async () => {
  isLoading.value = true;
  try {
    const [fc, risk] = await Promise.all([
      apiClient.get('/dashboard/forecast'),
      apiClient.get('/dashboard/risk-index'),
    ]);
    commodities.value = fc.data?.data?.commodities ?? [];
    riskItems.value = risk.data?.data?.items ?? [];
    riskFormula.value = risk.data?.data?.formula ?? '';
  } catch (e) {
    await toast('Failed to load analytics.', 'danger');
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadAll);
</script>

<style scoped>
.analytics-bg { --background: #f4f8f5; }
.wrapper { max-width: 820px; margin: 0 auto; }
.loading { margin-top: 3rem; }
.insight-card { border-radius: 14px; border-left: 4px solid var(--ion-color-primary); margin: 0 0 1.2rem; }
.insight-head { display: flex; align-items: center; gap: 8px; }
.insight-head h2 { font-size: 1.05rem; font-weight: 800; margin: 0; color: #0f172a; }
.insight-head ion-icon { color: #f59e0b; font-size: 1.4rem; }
.insight-list { margin: 0.6rem 0 0; padding-left: 1.1rem; }
.insight-list li { color: #334155; font-size: 0.9rem; margin-bottom: 0.35rem; }
.section-title { display: flex; align-items: center; gap: 8px; font-size: 1rem; font-weight: 800; color: #1a4731; margin: 1.4rem 0 0.7rem; }
.chart-card { border-radius: 14px; margin: 0 0 1rem; }
.chart-head { display: flex; justify-content: space-between; align-items: center; }
.chart-head h4 { margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; }
.forecast-summary { display: flex; gap: 1.5rem; margin: 0.6rem 0; }
.fc-item { display: flex; flex-direction: column; }
.fc-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
.fc-value { font-weight: 800; color: #16a34a; font-size: 1.05rem; }
.note { color: #94a3b8; font-style: italic; font-size: 0.85rem; }
.chart-box { height: 240px; margin-top: 0.5rem; }
.empty { color: #94a3b8; text-align: center; padding: 1rem; font-size: 0.9rem; }
.risk-row { display: grid; grid-template-columns: 1.4fr 1fr 1fr 0.6fr 1.2fr; align-items: center; gap: 6px; padding: 0.5rem 0; border-bottom: 1px solid #eef2f5; font-size: 0.85rem; }
.risk-header { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.4px; }
.col-num, .col-score { text-align: right; }
.col-num small { color: #94a3b8; }
.formula { margin-top: 0.8rem; font-size: 0.75rem; color: #94a3b8; font-family: monospace; }
</style>
