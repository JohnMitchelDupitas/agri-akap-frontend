<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>RSBSA Registry</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar 
          placeholder="Search RSBSA No. or Name..." 
          @ionInput="handleSearch"
          :debounce="500">
        </ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      
      <ion-text color="danger" v-if="farmerStore.error">
        <p>{{ farmerStore.error }}</p>
      </ion-text>

      <div v-if="farmerStore.isLoading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Loading registry data...</p>
      </div>

      <div v-else-if="farmerStore.farmers.length === 0" class="empty-state">
        <ion-icon :icon="leafOutline" size="large"></ion-icon>
        <p>No farmers found in the registry.</p>
      </div>

      <ion-list v-else>
        <ion-item v-for="farmer in farmerStore.farmers" :key="farmer.id" button>
          <ion-avatar slot="start">
            <img :src="getPhoto(farmer)" />
          </ion-avatar>
          <ion-label>
            <h2>{{ farmer.surname }}, {{ farmer.first_name }}</h2>
            <p>RSBSA: {{ farmer.rsbsa_no || 'Pending' }}</p>
          </ion-label>
          <ion-badge slot="end" color="success">
            {{ farmer.farm_plots_count }} Plot(s)
          </ion-badge>
        </ion-item>
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="goToRegistration">
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFarmerStore } from '../../stores/farmerStore';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonMenuButton, IonSearchbar, IonSpinner, 
  IonList, IonItem, IonLabel, IonAvatar, IonBadge, IonText, 
  IonIcon, IonFab, IonFabButton 
} from '@ionic/vue';
import { add, leafOutline } from 'ionicons/icons';

const router = useRouter();
const farmerStore = useFarmerStore();

// Fetch data as soon as the view mounts
onMounted(() => {
  farmerStore.fetchFarmers();
});

// Triggered by the search bar with a 500ms debounce
const handleSearch = (event: any) => {
  const query = event.target.value;
  farmerStore.fetchFarmers(1, query); // Reset to page 1 on search
};

const goToRegistration = () => {
  router.push('/farmers/register');
};

// Helper to safely access optional photo path on farmer objects
const getPhoto = (farmer: any) => {
  return farmer && (farmer as any).photo_path ? (farmer as any).photo_path : '/placeholder-avatar.png';
};
</script>

<style scoped>
.loading-container, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  color: var(--ion-color-medium);
}
</style>