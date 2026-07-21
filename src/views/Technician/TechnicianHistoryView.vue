<template>
  <ion-page>
    <ion-content class="ion-padding page-bg">
      <header class="page-head">
        <h1>Sync History</h1>
        <p>Past field logs synced to the MAO dashboard will appear here.</p>
      </header>

      <div class="empty-state">
        <ion-icon :icon="timeOutline"></ion-icon>
        <h2>No synced logs yet</h2>
        <p>Complete a pest response, RDANA assessment, or subsidy release — synced records will show in this timeline.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonIcon } from '@ionic/vue';
import { timeOutline } from 'ionicons/icons';
</script>

<style scoped>
.page-bg { --background: #f4f8f5; }

.page-head {
  margin-bottom: 1.5rem;
  padding-top: 0.5rem;
}

.page-head h1 {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 800;
  color: #1a4731;
}

.page-head p {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  color: #64748b;
}

.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  background: #fff;
  border: 1px dashed #c5d9cc;
  border-radius: 16px;
}

.empty-state ion-icon {
  font-size: 48px;
  color: #94a3b8;
  margin-bottom: 0.75rem;
}

.empty-state h2 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 800;
  color: #1a4731;
}

.empty-state p {
  margin: 0;
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.45;
  max-width: 280px;
  margin-inline: auto;
}
</style>
