<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Initialize Campaign</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding modal-bg">
      <div class="form-wrapper">
        <h3 class="section-title">Program Details</h3>

        <div v-if="errorMsg" class="error-banner mb-3">
          {{ errorMsg }}
        </div>

        <ion-item class="custom-input">
          <ion-input v-model="form.name" label="Program Name *" label-placement="floating" placeholder="e.g. 2026 Wet Season Rice"></ion-input>
        </ion-item>

        <ion-item class="custom-input">
          <ion-select v-model="form.type" label="Resource Type *" label-placement="floating">
            <ion-select-option value="seeds">Seeds</ion-select-option>
            <ion-select-option value="fertilizer">Fertilizer</ion-select-option>
            <ion-select-option value="cash">Cash Assistance</ion-select-option>
            <ion-select-option value="equipment">Equipment</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item class="custom-input">
          <ion-input v-model="form.funding_source" label="Funding Source *" label-placement="floating" placeholder="e.g. DA-RFO II"></ion-input>
        </ion-item>

        <h3 class="section-title mt-4">Inventory & Rules</h3>
        
        <ion-row>
          <ion-col size="6">
            <ion-item class="custom-input">
              <ion-input type="number" v-model="form.total_quantity" label="Total Units *" label-placement="floating"></ion-input>
            </ion-item>
          </ion-col>
          <ion-col size="6">
            <ion-item class="custom-input">
              <ion-input v-model="form.unit_of_measurement" label="Unit (e.g. Bags) *" label-placement="floating"></ion-input>
            </ion-item>
          </ion-col>
        </ion-row>

        <ion-row>
          <ion-col size="6">
            <ion-item class="custom-input">
              <ion-input type="number" v-model="form.per_hectare_allocation" label="Units per Hectare *" label-placement="floating"></ion-input>
            </ion-item>
          </ion-col>
          <ion-col size="6">
            <ion-item class="custom-input">
              <ion-input type="number" v-model="form.max_hectare_cap" label="Max Hectare Cap *" label-placement="floating"></ion-input>
            </ion-item>
          </ion-col>
        </ion-row>

        <h3 class="section-title mt-4">Schedule & Budget</h3>

        <ion-row>
          <ion-col size="6">
            <ion-item class="custom-input">
              <ion-input type="date" v-model="form.start_date" label="Start Date *" label-placement="floating"></ion-input>
            </ion-item>
          </ion-col>
          <ion-col size="6">
            <ion-item class="custom-input">
              <ion-input type="date" v-model="form.end_date" label="End Date *" label-placement="floating"></ion-input>
            </ion-item>
          </ion-col>
        </ion-row>

        <ion-item class="custom-input">
          <ion-input type="number" v-model="form.budget_allocation" label="Budget Allocation (₱)" label-placement="floating" placeholder="0.00"></ion-input>
        </ion-item>

      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar class="ion-padding-horizontal py-2">
        <ion-button expand="block" color="success" @click="submitProgram" :disabled="isSubmitting">
          {{ isSubmitting ? 'Initializing...' : 'Save & Initialize Program' }}
        </ion-button>
      </ion-toolbar>
    </ion-footer>
  </ion-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { 
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonItem, IonInput, IonSelect, IonSelectOption, IonRow, IonCol, IonFooter
} from '@ionic/vue';
import axiosInstance from '@/utils/axios';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close', 'program-created']);

const isSubmitting = ref(false);
const errorMsg = ref('');

// Default Form State
const getInitialForm = () => ({
  name: '',
  type: 'seeds',
  funding_source: 'DA-RFO II',
  total_quantity: null,
  unit_of_measurement: 'bags',
  per_hectare_allocation: 1.00,
  max_hectare_cap: 3.00,
  start_date: '',
  end_date: '',
  budget_allocation: 0
});

const form = reactive(getInitialForm());

// Reset form when modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    Object.assign(form, getInitialForm());
    errorMsg.value = '';
  }
});

const submitProgram = async () => {
  isSubmitting.value = true;
  errorMsg.value = '';

  try {
    await axiosInstance.post('/programs', form);
    emit('program-created'); // Tell the parent to refresh the list and close
  } catch (error: any) {
    if (error.response?.status === 422) {
      // Show the first validation error from Laravel
      const laravelErrors = error.response.data.errors;
      const firstErrorKey = Object.keys(laravelErrors)[0];
      errorMsg.value = laravelErrors[firstErrorKey][0];
    } else {
      errorMsg.value = 'Failed to create program. Please check your connection.';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.modal-bg { --background: #f4f8f5; }
.form-wrapper { max-width: 600px; margin: 0 auto; padding-bottom: 2rem; }
.section-title { font-size: 1rem; color: #2a6648; font-weight: 800; margin-bottom: 10px; border-bottom: 2px solid #e8f0eb; padding-bottom: 5px; }

.custom-input { --background: #ffffff; border-radius: 8px; margin-bottom: 0.8rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }

.error-banner { background: #ffebee; color: #c0392b; padding: 10px; border-radius: 6px; font-size: 0.9rem; font-weight: 600; border: 1px solid #ffcdd2; }
.mb-3 { margin-bottom: 1rem; }
.mt-4 { margin-top: 1.5rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
</style>