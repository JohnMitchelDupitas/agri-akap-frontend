<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Damage Review</ion-title>
      </ion-toolbar>
      <ion-toolbar color="primary">
        <ion-segment v-model="statusFilter" @ionChange="fetchList">
          <ion-segment-button value="Pending"><ion-label>Pending</ion-label></ion-segment-button>
          <ion-segment-button value="Verified"><ion-label>Verified</ion-label></ion-segment-button>
          <ion-segment-button value="Approved"><ion-label>Approved</ion-label></ion-segment-button>
          <ion-segment-button value="Rejected"><ion-label>Rejected</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding review-bg">
      <div class="wrapper">
        <div v-if="isLoading" class="ion-text-center"><ion-spinner name="crescent"></ion-spinner></div>

        <EmptyState
          v-else-if="!items.length"
          variant="documents"
          :title="`No ${statusFilter.toLowerCase()} assessments`"
          :message="`No ${statusFilter.toLowerCase()} damage reports found.`"
        />

        <ion-card v-for="a in items" :key="a.id" class="review-card">
          <img v-if="a.photo_url" :src="a.photo_url" class="evidence-img" alt="Damage evidence" />
          <ion-card-content>
            <div class="head-row">
              <div>
                <h2 class="calamity">{{ a.calamity_name }}</h2>
                <p class="farmer">{{ a.farmer?.first_name }} {{ a.farmer?.surname }} &middot; {{ a.farmer?.permanent_brgy }}</p>
              </div>
              <StatusBadge :status="a.status" />
            </div>

            <ion-grid class="meta-grid">
              <ion-row>
                <ion-col size="6"><span class="lbl">Damage</span><span class="val">{{ a.damage_percentage }}%</span></ion-col>
                <ion-col size="6"><span class="lbl">Est. Loss</span><span class="val">PHP {{ formatMoney(a.estimated_value_lost) }}</span></ion-col>
              </ion-row>
              <ion-row>
                <ion-col size="6"><span class="lbl">Date</span><span class="val">{{ formatDate(a.date_of_calamity) }}</span></ion-col>
                <ion-col size="6"><span class="lbl">Commodity</span><span class="val">{{ a.farm_plot?.commodity || '-' }}</span></ion-col>
              </ion-row>
            </ion-grid>

            <button
              v-if="a.latitude && a.longitude"
              type="button"
              class="map-link"
              @click="viewOnMap(a)"
            >
              <ion-icon :icon="locationOutline"></ion-icon>
              View on Map ({{ Number(a.latitude).toFixed(4) }}, {{ Number(a.longitude).toFixed(4) }})
            </button>

            <p v-if="a.remarks" class="remarks">"{{ a.remarks }}"</p>

            <!-- Barangay Official: pre-assess a Pending report -->
            <ion-button
              v-if="a.status === 'Pending' && canVerify"
              expand="block"
              color="secondary"
              class="mt-2"
              @click="verify(a)"
            >
              <ion-icon slot="start" :icon="shieldCheckmarkOutline"></ion-icon>
              Pre-Assess &amp; Endorse to MAO
            </ion-button>

            <!-- MAO Admin: final decision on a Verified report -->
            <div v-if="['Pending', 'Verified'].includes(a.status) && canApprove" class="decision-row mt-2">
              <ion-button color="success" @click="decide(a, 'Approved')">
                <ion-icon slot="start" :icon="checkmarkCircleOutline"></ion-icon>Approve
              </ion-button>
              <ion-button color="danger" fill="outline" @click="decide(a, 'Rejected')">
                <ion-icon slot="start" :icon="closeCircleOutline"></ion-icon>Reject
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonSegment, IonSegmentButton, IonLabel, IonCard, IonCardContent,
  IonGrid, IonRow, IonCol, IonButton, IonIcon, IonSpinner, alertController, toastController,
} from '@ionic/vue';
import {
  shieldCheckmarkOutline, checkmarkCircleOutline, closeCircleOutline,
  locationOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import apiClient from '@/utils/axios';
import { useAuthStore } from '@/stores/authStore';
import StatusBadge from '@/components/StatusBadge.vue';
import EmptyState from '@/components/EmptyState.vue';

const authStore = useAuthStore();
const router = useRouter();

const viewOnMap = (a: any) => {
  const mapPath = authStore.userRole === 'barangay_official' ? '/brgy/map' : '/admin/map';
  router.push({ path: mapPath, query: { lat: a.latitude, lng: a.longitude } });
};
const items = ref<any[]>([]);
const isLoading = ref(true);
const statusFilter = ref<'Pending' | 'Verified' | 'Approved' | 'Rejected'>('Pending');

const canVerify = computed(() => ['barangay_official', 'admin'].includes(authStore.userRole || ''));
const canApprove = computed(() => authStore.userRole === 'admin');

const toast = async (message: string, color = 'primary') => {
  const t = await toastController.create({ message, duration: 2200, color, position: 'top' });
  await t.present();
};

const fetchList = async () => {
  isLoading.value = true;
  try {
    const res = await apiClient.get('/damage-assessments', { params: { status: statusFilter.value } });
    items.value = res.data?.data?.data ?? [];
  } catch (e) {
    await toast('Failed to load assessments.', 'danger');
  } finally {
    isLoading.value = false;
  }
};

const promptRemarks = async (header: string): Promise<string | null> => {
  return new Promise(async (resolve) => {
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
};

const verify = async (a: any) => {
  const remarks = await promptRemarks('Pre-Assess Damage');
  if (remarks === null) return;
  try {
    await apiClient.patch(`/damage-assessments/${a.id}/verify`, { remarks });
    await toast('Endorsed to MAO for approval.', 'success');
    await fetchList();
  } catch (e: any) {
    await toast(e.response?.data?.message || 'Action failed.', 'danger');
  }
};

const decide = async (a: any, decision: 'Approved' | 'Rejected') => {
  const remarks = await promptRemarks(`${decision} Assessment`);
  if (remarks === null) return;
  try {
    await apiClient.patch(`/damage-assessments/${a.id}/decide`, { decision, remarks });
    await toast(`Assessment ${decision.toLowerCase()}.`, decision === 'Approved' ? 'success' : 'medium');
    await fetchList();
  } catch (e: any) {
    await toast(e.response?.data?.message || 'Action failed.', 'danger');
  }
};

const formatMoney = (v: any) => (v ? Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00');
const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString() : '-');

onMounted(fetchList);
</script>

<style scoped>
.review-bg { --background: #f4f8f5; }
.wrapper { max-width: 720px; margin: 0 auto; }
.review-card { border-radius: 14px; overflow: hidden; margin: 0 0 1rem; }
.evidence-img { width: 100%; max-height: 240px; object-fit: cover; display: block; }
.head-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; }
.calamity { color: #c0392b; font-weight: 800; margin: 0; font-size: 1.15rem; }
.farmer { color: #334155; margin: 2px 0 0; font-weight: 600; font-size: 0.9rem; }
.meta-grid { margin-top: 0.6rem; }
.meta-grid .lbl { display: block; font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
.meta-grid .val { display: block; font-weight: 700; color: #0f172a; }
.map-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 0.6rem; color: var(--ion-color-primary); font-weight: 600; text-decoration: none; font-size: 0.9rem; background: none; border: none; padding: 0; cursor: pointer; }
.remarks { margin-top: 0.6rem; font-style: italic; color: #64748b; }
.decision-row { display: flex; gap: 0.6rem; }
.decision-row ion-button { flex: 1; }
.mt-2 { margin-top: 0.75rem; }
</style>
