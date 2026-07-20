<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet id="tech-content"></ion-router-outlet>

      <ion-tab-bar slot="bottom" class="tech-tabbar">
        <ion-tab-button tab="scanner" href="/tech/scanner">
          <ion-icon :icon="qrCodeOutline" />
          <ion-label>QR Scan</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="field" href="/tech/field">
          <ion-icon :icon="leafOutline" />
          <ion-label>Field Intel</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profiling" href="/tech/farm-profiling">
          <ion-icon :icon="mapOutline" />
          <ion-label>Farm Profile</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="extension" href="/tech/extension">
          <ion-icon :icon="peopleOutline" />
          <ion-label>Extension</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonTabs, IonTabBar, IonTabButton, IonRouterOutlet,
  IonIcon, IonLabel,
} from '@ionic/vue';
import {
  qrCodeOutline, leafOutline, mapOutline, peopleOutline,
} from 'ionicons/icons';
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
  position: relative;
}
ion-tab-button.tab-selected {
  --color-selected: var(--mao-green);
}
ion-tab-button.tab-selected::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 28%;
  right: 28%;
  height: 3px;
  border-radius: 2px;
  background: var(--mao-gold);
}
ion-tab-button ion-icon {
  font-size: 22px;
}
ion-tab-button ion-label {
  font-size: 0.72rem;
  margin-top: 2px;
}
</style>
