<template>
  <ion-app>
    <template v-if="showShell">
      <ion-split-pane
        content-id="main-content"
        when="xs"
        class="responsive-split"
      >
        <app-sidebar />

        <ion-router-outlet id="main-content" />
      </ion-split-pane>
    </template>

    <template v-else>
      <ion-router-outlet id="main-content" />
    </template>
  </ion-app>
</template>

<script setup lang="ts">
import {
  IonApp,
  IonRouterOutlet,
  IonSplitPane
} from '@ionic/vue';

import AppSidebar from '@/components/AppSidebar.vue';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();

const showShell = computed(() => route.name !== 'Login');
</script>