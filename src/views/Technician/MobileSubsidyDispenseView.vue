<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tech/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Subsidy Dispense</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding page-bg">
      <div class="hero">
        <div class="icon-wrap">
          <ion-icon :icon="qrCodeOutline"></ion-icon>
        </div>
        <h2>Scan Farmer QR ID</h2>
        <p>Select an active program, scan the farmer's RSBSA QR, and release seeds or fertilizer.</p>
      </div>

      <ion-button expand="block" class="scan-btn" @click="openScanner">
        <ion-icon slot="start" :icon="qrCodeOutline"></ion-icon>
        Start QR Scan
      </ion-button>

      <ion-note class="placeholder-note">
        Full distribution workflow will connect to program inventory and release logs.
        For now, this opens the existing scanner module.
      </ion-note>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonNote,
} from '@ionic/vue';
import { qrCodeOutline } from 'ionicons/icons';

const router = useRouter();

const openScanner = () => router.push('/tech/scanner');
</script>

<style scoped>
.page-bg { --background: #f4f8f5; }

.hero {
  text-align: center;
  margin: 1.5rem 0 2rem;
}

.icon-wrap {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  border-radius: 20px;
  background: #e8f5e9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a4731;
}

.icon-wrap ion-icon {
  font-size: 44px;
}

.hero h2 {
  margin: 0 0 0.5rem;
  font-size: 1.35rem;
  font-weight: 800;
  color: #1a4731;
}

.hero p {
  margin: 0;
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.45;
  max-width: 320px;
  margin-inline: auto;
}

.scan-btn {
  --background: #1a4731;
  --border-radius: 14px;
  min-height: 56px;
  font-size: 1.05rem;
  font-weight: 800;
  text-transform: none;
  margin-bottom: 1rem;
}

.placeholder-note {
  display: block;
  text-align: center;
  font-size: 0.82rem;
  line-height: 1.45;
  padding: 0 0.5rem;
}
</style>
