<template>
  <div class="empty-state" role="status">
    <div class="empty-state__art" aria-hidden="true">
      <svg
        v-if="variant === 'documents'"
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="28" y="18" width="72" height="90" rx="6" fill="#e8f5e9" stroke="#1a4731" stroke-width="2" />
        <rect x="40" y="34" width="48" height="6" rx="2" fill="#2a6648" opacity="0.35" />
        <rect x="40" y="48" width="40" height="6" rx="2" fill="#2a6648" opacity="0.25" />
        <rect x="40" y="62" width="44" height="6" rx="2" fill="#2a6648" opacity="0.25" />
        <rect x="60" y="28" width="72" height="90" rx="6" fill="#ffffff" stroke="#1a4731" stroke-width="2" />
        <rect x="72" y="44" width="48" height="6" rx="2" fill="#d4af37" opacity="0.7" />
        <rect x="72" y="58" width="36" height="6" rx="2" fill="#1a4731" opacity="0.2" />
        <rect x="72" y="72" width="42" height="6" rx="2" fill="#1a4731" opacity="0.2" />
        <circle cx="118" cy="96" r="18" fill="#d4af37" opacity="0.2" />
      </svg>

      <svg
        v-else-if="variant === 'farmers'"
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="80" cy="98" rx="52" ry="10" fill="#e8f5e9" />
        <circle cx="80" cy="42" r="18" fill="#1a4731" />
        <path d="M48 96c0-18 14-32 32-32s32 14 32 32" fill="#2a6648" />
        <circle cx="48" cy="50" r="12" fill="#2a6648" opacity="0.7" />
        <path d="M28 96c0-12 9-22 20-22s20 10 20 22" fill="#1a4731" opacity="0.55" />
        <circle cx="112" cy="50" r="12" fill="#2a6648" opacity="0.7" />
        <path d="M92 96c0-12 9-22 20-22s20 10 20 22" fill="#1a4731" opacity="0.55" />
        <rect x="72" y="18" width="16" height="6" rx="2" fill="#d4af37" />
      </svg>

      <svg
        v-else-if="variant === 'sync'"
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="80" cy="100" rx="48" ry="8" fill="#e8f5e9" />
        <path
          d="M52 58a28 28 0 0 1 48-14"
          stroke="#1a4731"
          stroke-width="6"
          stroke-linecap="round"
          fill="none"
        />
        <path d="M96 40l8 4-10 6 2-10z" fill="#d4af37" />
        <path
          d="M108 62a28 28 0 0 1-48 14"
          stroke="#2a6648"
          stroke-width="6"
          stroke-linecap="round"
          fill="none"
        />
        <path d="M64 80l-8-4 10-6-2 10z" fill="#d4af37" />
        <circle cx="80" cy="60" r="8" fill="#1a4731" />
      </svg>

      <svg
        v-else-if="variant === 'inventory'"
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="36" y="40" width="88" height="56" rx="6" fill="#e8f5e9" stroke="#1a4731" stroke-width="2" />
        <path d="M36 56h88" stroke="#1a4731" stroke-width="2" />
        <rect x="52" y="28" width="56" height="16" rx="3" fill="#1a4731" />
        <rect x="48" y="68" width="28" height="18" rx="3" fill="#ffffff" stroke="#2a6648" stroke-width="1.5" />
        <rect x="84" y="68" width="28" height="18" rx="3" fill="#ffffff" stroke="#2a6648" stroke-width="1.5" />
        <circle cx="124" cy="36" r="14" fill="#d4af37" opacity="0.85" />
        <path d="M124 28v16M116 36h16" stroke="#1a4731" stroke-width="2.5" stroke-linecap="round" />
      </svg>

      <svg
        v-else
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="80" cy="98" rx="50" ry="10" fill="#e8f5e9" />
        <rect x="48" y="28" width="64" height="58" rx="8" fill="#ffffff" stroke="#1a4731" stroke-width="2" />
        <circle cx="80" cy="52" r="12" fill="#e8f5e9" stroke="#1a4731" stroke-width="2" />
        <path d="M68 72h24" stroke="#d4af37" stroke-width="4" stroke-linecap="round" />
        <path d="M74 42l6 6 10-12" stroke="#1a4731" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.35" />
      </svg>
    </div>

    <h3 v-if="title" class="empty-state__title">{{ title }}</h3>
    <p class="empty-state__message">{{ message }}</p>

    <ion-button
      v-if="actionLabel"
      class="empty-state__cta"
      color="primary"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </ion-button>

    <slot />
  </div>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue';

withDefaults(
  defineProps<{
    message: string;
    title?: string;
    actionLabel?: string;
    variant?: 'generic' | 'documents' | 'farmers' | 'sync' | 'inventory';
  }>(),
  {
    title: '',
    actionLabel: '',
    variant: 'generic',
  },
);

defineEmits<{
  action: [];
}>();
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2.5rem 1.25rem;
  max-width: 420px;
  margin: 1.5rem auto;
}

.empty-state__art {
  width: 160px;
  height: 120px;
  margin-bottom: 1rem;
}

.empty-state__art svg {
  width: 100%;
  height: 100%;
}

.empty-state__title {
  margin: 0 0 0.35rem;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--mao-green, #1a4731);
}

.empty-state__message {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--mao-text-muted, #5f7268);
}

.empty-state__cta {
  margin-top: 1.15rem;
  --border-radius: 10px;
  font-weight: 700;
  text-transform: none;
}
</style>
