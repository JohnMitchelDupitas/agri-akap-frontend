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

        <div v-if="errorMsg" class="error-banner mb-3">
          <strong>Validation Error:</strong> {{ errorMsg }}
        </div>

        <h3 class="section-title">Program Details</h3>

        <ion-item class="custom-input">
          <ion-input
            v-model="form.name"
            label="Program Name *"
            label-placement="floating"
            placeholder="e.g. 2026 Wet Season Rice Seeds"
          ></ion-input>
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
          <ion-input
            v-model="form.funding_source"
            label="Funding Source *"
            label-placement="floating"
            placeholder="e.g. DA-RFO II"
          ></ion-input>
        </ion-item>

        <ion-item class="custom-input">
          <ion-input
            v-model="form.description"
            label="Description (optional)"
            label-placement="floating"
            placeholder="Brief description of the program"
          ></ion-input>
        </ion-item>

        <h3 class="section-title mt-4">Inventory & Distribution Rules</h3>

        <ion-row>
          <ion-col size="6">
            <ion-item class="custom-input">
              <ion-input
                type="number"
                v-model.number="form.total_quantity"
                label="Total Units *"
                label-placement="floating"
                :min="1"
              ></ion-input>
            </ion-item>
          </ion-col>
          <ion-col size="6">
            <ion-item class="custom-input">
              <ion-input
                v-model="form.unit_of_measurement"
                label="Unit (e.g. bags) *"
                label-placement="floating"
              ></ion-input>
            </ion-item>
          </ion-col>
        </ion-row>

        <ion-row>
          <ion-col size="6">
            <ion-item class="custom-input">
              <ion-input
                type="number"
                v-model.number="form.per_hectare_allocation"
                label="Units per Hectare *"
                label-placement="floating"
                :min="0.01"
                step="0.01"
              ></ion-input>
            </ion-item>
          </ion-col>
          <ion-col size="6">
            <ion-item class="custom-input">
              <ion-input
                type="number"
                v-model.number="form.max_hectare_cap"
                label="Max Hectare Cap"
                label-placement="floating"
                :min="0"
                step="0.01"
              ></ion-input>
            </ion-item>
          </ion-col>
        </ion-row>

        <h3 class="section-title mt-4">Schedule & Budget</h3>

        <ion-row>
          <ion-col size="6">
            <ion-item class="custom-input">
              <ion-input
                type="date"
                v-model="form.start_date"
                label="Start Date *"
                label-placement="floating"
                :min="today"
              ></ion-input>
            </ion-item>
          </ion-col>
          <ion-col size="6">
            <ion-item class="custom-input">
              <ion-input
                type="date"
                v-model="form.end_date"
                label="End Date *"
                label-placement="floating"
                :min="form.start_date || today"
              ></ion-input>
            </ion-item>
          </ion-col>
        </ion-row>

        <ion-item class="custom-input">
          <ion-input
            type="number"
            v-model.number="form.budget_allocation"
            label="Budget Allocation (₱)"
            label-placement="floating"
            placeholder="0.00"
            :min="0"
            step="0.01"
          ></ion-input>
        </ion-item>

      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar class="ion-padding-horizontal py-2">
        <ion-button expand="block" color="success" @click="submitProgram" :disabled="isSubmitting">
          <ion-icon slot="start" :icon="layersOutline"></ion-icon>
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
  IonItem, IonInput, IonSelect, IonSelectOption, IonRow, IonCol, IonFooter, IonIcon,
  toastController,
} from '@ionic/vue';
import { layersOutline } from 'ionicons/icons';
import axiosInstance from '@/utils/axios';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close', 'program-created']);

const today = new Date().toISOString().split('T')[0];

const isSubmitting = ref(false);
const errorMsg = ref('');

const getInitialForm = () => ({
  name: '',
  type: 'seeds' as 'seeds' | 'fertilizer' | 'cash' | 'equipment',
  funding_source: 'DA-RFO II',
  description: '',
  total_quantity: 0,
  unit_of_measurement: 'bags',
  per_hectare_allocation: 1,
  max_hectare_cap: 3,
  start_date: '',
  end_date: '',
  budget_allocation: 0,
});

const form = reactive(getInitialForm());

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    Object.assign(form, getInitialForm());
    errorMsg.value = '';
  }
});

const validate = (): string | null => {
  if (!form.name.trim()) return 'Program name is required.';
  if (!form.funding_source.trim()) return 'Funding source is required.';
  if (!form.unit_of_measurement.trim()) return 'Unit of measurement is required.';
  if (!form.total_quantity || form.total_quantity < 1) return 'Total units must be at least 1.';
  if (!form.per_hectare_allocation || form.per_hectare_allocation <= 0) return 'Units per hectare must be greater than 0.';
  if (!form.start_date) return 'Start date is required.';
  if (!form.end_date) return 'End date is required.';
  if (form.end_date <= form.start_date) return 'End date must be after start date.';
  return null;
};

const submitProgram = async () => {
  const validationError = validate();
  if (validationError) {
    errorMsg.value = validationError;
    return;
  }

  isSubmitting.value = true;
  errorMsg.value = '';

  try {
    await axiosInstance.post('/programs', form);
    const t = await toastController.create({
      message: 'Program initialized successfully!',
      duration: 2500,
      color: 'success',
      position: 'top',
    });
    await t.present();
    emit('program-created');
  } catch (err: any) {
    if (err.response?.status === 422) {
      const errors = err.response.data.errors;
      errorMsg.value = errors[Object.keys(errors)[0]][0];
    } else {
      errorMsg.value = err.response?.data?.message ?? 'Failed to create program. Check your connection.';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.modal-bg { --background: #f4f8f5; }
.form-wrapper { max-width: 600px; margin: 0 auto; padding-bottom: 2rem; }
.section-title { font-size: 0.95rem; color: #2a6648; font-weight: 800; margin: 0 0 10px; border-bottom: 2px solid #e8f0eb; padding-bottom: 5px; }
.custom-input { --background: #ffffff; border-radius: 8px; margin-bottom: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.error-banner { background: #ffebee; color: #c0392b; padding: 10px 14px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; border: 1px solid #ffcdd2; }
.mb-3 { margin-bottom: 1rem; }
.mt-4 { margin-top: 1.5rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
</style>
