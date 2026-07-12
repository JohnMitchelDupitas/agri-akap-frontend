<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Pending Sync</ion-title>
        <ion-buttons slot="end">
          <ion-chip :color="syncStore.online ? 'success' : 'medium'" outline>
            <ion-icon :icon="syncStore.online ? cloudDoneOutline : cloudOfflineOutline"></ion-icon>
            <ion-label>{{ syncStore.online ? 'Online' : 'Offline' }}</ion-label>
          </ion-chip>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding queue-bg">
      <div class="wrapper">
        <ion-card class="summary-card">
          <ion-card-content>
            <div class="summary-row">
              <div>
                <p class="summary-count">{{ syncStore.pending }}</p>
                <p class="summary-label">Records waiting to upload</p>
              </div>
              <ion-button
                :disabled="!syncStore.online || syncStore.isSyncing || syncStore.pending === 0"
                @click="syncNow"
              >
                <ion-icon slot="start" :icon="syncOutline"></ion-icon>
                {{ syncStore.isSyncing ? 'Syncing...' : 'Sync Now' }}
              </ion-button>
            </div>
            <p v-if="syncStore.lastMessage" class="last-msg">{{ syncStore.lastMessage }}</p>
            <p v-if="!syncStore.online" class="offline-note">
              You are offline. Records are safely stored on this device and will upload automatically when a connection is restored.
            </p>
          </ion-card-content>
        </ion-card>

        <!-- Distributions -->
        <h3 class="section-title" v-if="distributions.length">Subsidy Claims ({{ distributions.length }})</h3>
        <ion-card v-for="d in distributions" :key="d.client_id" class="item-card">
          <ion-card-content>
            <div class="item-head">
              <strong>{{ d.farmer_name || 'Farmer' }}</strong>
              <ion-badge :color="statusColor(d.status)">{{ d.status }}</ion-badge>
            </div>
            <p class="item-sub">{{ d.program_name || d.program_id }}</p>
            <p class="item-meta">Queued {{ formatDate(d.created_at) }}</p>
            <p v-if="d.error" class="item-error">{{ d.error }}</p>
            <ion-button size="small" fill="clear" color="danger" @click="removeDistribution(d.client_id)">
              <ion-icon slot="start" :icon="trashOutline"></ion-icon> Discard
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Assessments -->
        <h3 class="section-title" v-if="assessments.length">Damage Assessments ({{ assessments.length }})</h3>
        <ion-card v-for="a in assessments" :key="a.client_id" class="item-card">
          <ion-card-content>
            <div class="item-head">
              <strong>{{ a.calamity_name }}</strong>
              <ion-badge :color="statusColor(a.status)">{{ a.status }}</ion-badge>
            </div>
            <p class="item-sub">{{ a.farmer_name || 'Plot ' + a.farm_plot_id.substring(0, 6) }} &middot; {{ a.damage_percentage }}% damage</p>
            <p class="item-meta">Queued {{ formatDate(a.created_at) }}</p>
            <p v-if="a.error" class="item-error">{{ a.error }}</p>
            <ion-button size="small" fill="clear" color="danger" @click="removeAssessment(a.client_id)">
              <ion-icon slot="start" :icon="trashOutline"></ion-icon> Discard
            </ion-button>
          </ion-card-content>
        </ion-card>

        <div v-if="syncStore.pending === 0" class="empty-state">
          <ion-icon :icon="checkmarkDoneCircleOutline"></ion-icon>
          <p>All records are synced. Nothing pending.</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonButton, IonIcon, IonBadge, IonChip, IonLabel,
} from '@ionic/vue';
import {
  syncOutline, trashOutline, cloudDoneOutline, cloudOfflineOutline, checkmarkDoneCircleOutline,
} from 'ionicons/icons';
import { db, type PendingDistribution, type PendingAssessment, type QueueStatus } from '@/services/db';
import { useSyncStore } from '@/stores/syncStore';

const syncStore = useSyncStore();
const distributions = ref<PendingDistribution[]>([]);
const assessments = ref<PendingAssessment[]>([]);
let timer: number | undefined;

const load = async () => {
  distributions.value = await db.pendingDistributions.orderBy('created_at').reverse().toArray();
  assessments.value = await db.pendingAssessments.orderBy('created_at').reverse().toArray();
  await syncStore.refreshCount();
};

const syncNow = async () => {
  await syncStore.sync();
  await load();
};

const removeDistribution = async (id: string) => {
  await db.pendingDistributions.delete(id);
  await load();
};

const removeAssessment = async (id: string) => {
  await db.pendingAssessments.delete(id);
  await load();
};

const statusColor = (s: QueueStatus) =>
  s === 'failed' ? 'danger' : s === 'syncing' ? 'warning' : 'medium';

const formatDate = (iso: string) => new Date(iso).toLocaleString();

onMounted(async () => {
  await load();
  timer = window.setInterval(load, 4000);
});
onUnmounted(() => timer && clearInterval(timer));
</script>

<style scoped>
.queue-bg { --background: var(--mao-surface, #f4f8f5); }
.wrapper { max-width: 720px; margin: 0 auto; }
.summary-card { border-radius: 14px; border-top: 4px solid var(--ion-color-primary); }
.summary-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.summary-count { font-size: 2.4rem; font-weight: 900; color: var(--ion-color-primary); margin: 0; }
.summary-label { color: #64748b; margin: 0; font-size: 0.9rem; }
.last-msg { margin-top: 0.75rem; color: var(--ion-color-primary); font-weight: 600; }
.offline-note { margin-top: 0.75rem; color: #92400e; background: #fff8e1; padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; }
.section-title { color: var(--ion-color-primary); font-weight: 800; margin: 1.4rem 0 0.6rem; }
.item-card { border-radius: 12px; margin: 0 0 0.7rem; }
.item-head { display: flex; justify-content: space-between; align-items: center; }
.item-sub { margin: 4px 0 0; color: #334155; font-weight: 600; }
.item-meta { margin: 2px 0 0; color: #94a3b8; font-size: 0.8rem; }
.item-error { color: var(--ion-color-danger); font-size: 0.85rem; margin: 6px 0 0; }
.empty-state { text-align: center; color: #94a3b8; margin-top: 3rem; }
.empty-state ion-icon { font-size: 3.5rem; color: var(--ion-color-success); }
</style>
