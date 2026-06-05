<template>
  <ion-header>
    <ion-toolbar color="success">
      <ion-buttons slot="start">
        <ion-menu-button></ion-menu-button>
      </ion-buttons>
      <ion-title class="nav-title">{{ title }}</ion-title>
    </ion-toolbar>
  </ion-header>
</template>

<style scoped>
@media (max-width: 700px) {
  .nav-title {
    display: none;
  }
}
</style>