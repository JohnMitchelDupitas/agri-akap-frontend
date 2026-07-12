<template>
  <ion-split-pane content-id="admin-content" when="md" class="responsive-split">
    <app-sidebar />
    <ion-router-outlet id="admin-content" />
  </ion-split-pane>
</template>

<script setup lang="ts">
import { IonRouterOutlet, IonSplitPane } from '@ionic/vue';
import AppSidebar from '@/components/AppSidebar.vue';
</script>
