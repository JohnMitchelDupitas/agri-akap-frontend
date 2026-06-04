<template>
  <ion-header>
    <ion-toolbar color="success">
      <ion-buttons slot="start">
        <ion-menu-button></ion-menu-button>
      </ion-buttons>
      <ion-title>{{ title }}</ion-title>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton } from '@ionic/vue';

// Allow pages to pass a custom title to the navbar
defineProps({
  title: {
    type: String,
    default: 'AGRI AKAP'
  }
});
</script>