<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet id="tech-content"></ion-router-outlet>

      <ion-tab-bar slot="bottom" class="tech-tabbar">
        <ion-tab-button tab="scanner" href="/tech/scanner">
          <ion-icon :icon="qrCodeOutline" />
          <ion-label>Scan</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="field" href="/tech/field">
          <ion-icon :icon="leafOutline" />
          <ion-label>Field Log</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="damage" href="/tech/damage">
          <ion-icon :icon="warningOutline" />
          <ion-label>Damage</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="sync" href="/tech/sync">
          <ion-icon :icon="cloudUploadOutline" />
          <ion-label>Sync</ion-label>
          <ion-badge v-if="syncStore.pending > 0" color="warning">{{ syncStore.pending }}</ion-badge>
        </ion-tab-button>

        <ion-tab-button tab="home" href="/tech/home">
          <ion-icon :icon="gridOutline" />
          <ion-label>More</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonTabs, IonTabBar, IonTabButton, IonRouterOutlet,
  IonIcon, IonLabel, IonBadge,
} from '@ionic/vue';
import {
  qrCodeOutline, leafOutline, warningOutline, cloudUploadOutline, gridOutline,
} from 'ionicons/icons';
import { useSyncStore } from '@/stores/syncStore';

const syncStore = useSyncStore();
</script>

<style scoped>
.tech-tabbar {
  --background: #ffffff;
  --border: 1px solid var(--mao-border);
  height: 62px;
  padding-bottom: env(safe-area-inset-bottom);
}
ion-tab-button {
  --color: var(--mao-text-muted);
  --color-selected: var(--mao-green);
  font-weight: 600;
}
ion-tab-button ion-icon {
  font-size: 22px;
}
ion-tab-button ion-label {
  font-size: 0.72rem;
  margin-top: 2px;
}
</style>
