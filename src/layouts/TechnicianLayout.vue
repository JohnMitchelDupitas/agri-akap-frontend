<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet id="tech-content"></ion-router-outlet>

      <ion-tab-bar slot="bottom" class="tech-tabbar">
        <ion-tab-button tab="dashboard" href="/tech/dashboard">
          <ion-icon :icon="homeOutline" />
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="history" href="/tech/history">
          <ion-icon :icon="timeOutline" />
          <ion-label>History</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/tech/profile">
          <ion-icon :icon="personCircleOutline" />
          <ion-label>Profile</ion-label>
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
  homeOutline, timeOutline, personCircleOutline,
} from 'ionicons/icons';
</script>

<style scoped>
.tech-tabbar {
  --background: #ffffff;
  --border: 1px solid var(--mao-border, #e2e8f0);
  height: 62px;
  padding-bottom: env(safe-area-inset-bottom);
}

ion-tab-button {
  --color: var(--mao-text-muted, #64748b);
  --color-selected: #1a4731;
  font-weight: 600;
  position: relative;
}

ion-tab-button.tab-selected::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 28%;
  right: 28%;
  height: 3px;
  border-radius: 2px;
  background: #d4af37;
}

ion-tab-button ion-icon {
  font-size: 24px;
}

ion-tab-button ion-label {
  font-size: 0.72rem;
  margin-top: 2px;
}
</style>
