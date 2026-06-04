<template>
  <ion-menu content-id="main-content" type="overlay">
    <ion-header>
      <ion-toolbar color="success">
        <ion-title>AGRI AKAP Menu</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <ion-list id="inbox-list">
        <ion-menu-toggle :auto-hide="false" v-for="(p, i) in appPages" :key="i">
          <ion-item @click="selectedIndex = i" router-direction="root" :router-link="p.url" lines="none" :detail="false" class="hydrated">
            <ion-icon aria-hidden="true" slot="start" :ios="p.iosIcon" :md="p.mdIcon"></ion-icon>
            <ion-label>{{ p.title }}</ion-label>
          </ion-item>
        </ion-menu-toggle>
      </ion-list>
    </ion-content>
  </ion-menu>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  IonContent, IonIcon, IonItem, IonLabel, IonList, 
  IonMenu, IonMenuToggle, IonTitle, IonToolbar, IonHeader 
} from '@ionic/vue';
import { homeOutline, homeSharp, leafOutline, leafSharp, personOutline, personSharp } from 'ionicons/icons';

const selectedIndex = ref(0);

// Define your navigation routes here
const appPages = [
  { title: 'Dashboard', url: '/dashboard', iosIcon: homeOutline, mdIcon: homeSharp },
  { title: 'Crops Data', url: '/crops', iosIcon: leafOutline, mdIcon: leafSharp },
  { title: 'Farmers', url: '/register', iosIcon: personOutline, mdIcon: personSharp }
];
</script>

<style scoped>
/* Optional: Highlight the active menu item */
ion-item.selected {
  --color: var(--ion-color-success);
}
</style>