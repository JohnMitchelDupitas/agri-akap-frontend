<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { useSyncStore } from '@/stores/syncStore';
import { useAuthStore } from '@/stores/authStore';

const syncStore = useSyncStore();
const authStore = useAuthStore();

onMounted(async () => {
  syncStore.init();
  // Validate cached token; start inactivity watcher; honor soft-lock without wiping IndexedDB.
  await authStore.restoreSession();
  authStore.startInactivityWatcher();
});
</script>
