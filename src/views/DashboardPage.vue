<template>
  <ion-page>
    <app-navbar title="Dashboard" />
    
    <ion-content class="ion-padding">
      <h1>Welcome to AGRI AKAP</h1>
      <p>This layout is fully responsive for both web and mobile platforms.</p>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import AppNavbar from '@/components/AppNavbar.vue';
</script>