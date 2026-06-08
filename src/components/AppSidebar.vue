<template>
  <ion-menu content-id="main-content" type="overlay">
    <ion-header>
      <ion-toolbar color="success">
        <ion-title>AGRI AKAP Menu</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list id="inbox-list">
        <ion-menu-toggle
          :auto-hide="false"
          v-for="(p, i) in appPages"
          :key="i"
        >
          <ion-item
            @click="selectedIndex = i"
            router-direction="root"
            :router-link="p.url"
            lines="none"
            :detail="false"
            :class="{ selected: selectedIndex === i }"
            class="sidebar-item"
          >
            <ion-icon
              slot="start"
              :ios="p.iosIcon"
              :md="p.mdIcon"
              class="sidebar-icon"
            ></ion-icon>

            <ion-label class="menu-label">
              {{ p.title }}
            </ion-label>
          </ion-item>
        </ion-menu-toggle>
      </ion-list>
    </ion-content>
  </ion-menu>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonTitle,
  IonToolbar,
  IonHeader,
} from "@ionic/vue";

import {
  homeOutline,
  homeSharp,
  leafOutline,
  leafSharp,
  personOutline,
  personSharp,
} from "ionicons/icons";

const selectedIndex = ref(0);

const appPages = [
  {
    title: "Dashboard",
    url: "/dashboard",
    iosIcon: homeOutline,
    mdIcon: homeSharp,
  },
  {
    title: "Crops Data",
    url: "/crops",
    iosIcon: leafOutline,
    mdIcon: leafSharp,
  },
  {
    title: "Farmers",
    url: "/farmers",
    iosIcon: personOutline,
    mdIcon: personSharp,
  },
];
</script>

<style scoped>
@media (max-width: 700px) {

  ion-menu {
  --width: 56px !important;
  --max-width: 56px !important;
  --border: none !important;       
  border-right: none !important; 
}
  ion-header,
  ion-header ion-toolbar,
  ion-title {
    display: none !important;
  }

  ion-list {
    padding: 0;
  }

  .sidebar-item {
    --padding-start: 0;
    --inner-padding-end: 0;
    --min-height: 56px;
    justify-content: center;
  }

  .menu-label {
    display: none !important;
  }

  /* 4. Center the icon in the row */
  .sidebar-icon {
    font-size: 22px;
    margin: 0 auto !important;
    margin-inline-end: 0 !important;
  }

  ion-item ion-icon[slot="start"] {
    margin: 0 auto !important;
    margin-inline-end: 0 !important;
  }
}
</style>
