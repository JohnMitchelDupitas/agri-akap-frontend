<template>
  <span class="status-badge" :class="`status-badge--${normalized}`" :title="label">
    <ion-icon :icon="icon" aria-hidden="true"></ion-icon>
    <span class="status-badge__label">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonIcon } from '@ionic/vue';
import {
  checkmarkCircle,
  time,
  closeCircle,
  shieldCheckmark,
  ellipse,
} from 'ionicons/icons';

const props = defineProps<{
  status: string;
}>();

// Module-scope sets avoid per-instance array allocations.
const APPROVED = new Set(['approved', 'claimed', 'active', 'success', 'synced', 'ready']);
const PENDING = new Set(['pending', 'queued', 'awaiting', 'draft', 'submitted', 'syncing']);
const REJECTED = new Set(['rejected', 'failed', 'closed', 'inactive', 'danger', 'not continued']);
const VERIFIED = new Set(['verified', 'endorsed']);

const normalized = computed(() => {
  const s = (props.status || '').trim().toLowerCase();
  if (APPROVED.has(s)) return 'approved';
  if (PENDING.has(s)) return 'pending';
  if (REJECTED.has(s)) return 'rejected';
  if (VERIFIED.has(s)) return 'verified';
  return 'neutral';
});

const label = computed(() => {
  const raw = (props.status || '').trim();
  if (!raw) return 'Unknown';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
});

const icon = computed(() => {
  switch (normalized.value) {
    case 'approved':
      return checkmarkCircle;
    case 'pending':
      return time;
    case 'rejected':
      return closeCircle;
    case 'verified':
      return shieldCheckmark;
    default:
      return ellipse;
  }
});
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.2;
  white-space: nowrap;
  vertical-align: middle;
}

.status-badge ion-icon {
  font-size: 0.95rem;
  flex-shrink: 0;
}

.status-badge--approved {
  background: #e8f5e9;
  color: #1a4731;
}

.status-badge--pending {
  background: #fff8e1;
  color: #8a6d12;
}

.status-badge--rejected {
  background: #fdecea;
  color: #c0392b;
}

.status-badge--verified {
  background: #fff3cd;
  color: #7a5c00;
}

.status-badge--neutral {
  background: #eef2f0;
  color: #5f7268;
}
</style>
