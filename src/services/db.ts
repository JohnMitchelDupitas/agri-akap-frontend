import Dexie, { type Table } from 'dexie';

export type QueueStatus = 'pending' | 'syncing' | 'failed';

/**
 * A distribution claim created in the field. When offline it is queued here
 * with a client-generated UUID (client_id) which becomes the server record's
 * primary key on sync, making the upload idempotent.
 */
export interface PendingDistribution {
  client_id: string;
  farmer_id: string;
  farmer_name?: string;
  program_id: string;
  program_name?: string;
  device_id: string;
  claimed_at: string;
  status: QueueStatus;
  error?: string;
  created_at: string;
}

/**
 * A geotagged damage assessment captured in the field.
 */
export interface PendingAssessment {
  client_id: string;
  farm_plot_id: string;
  farmer_id?: string;
  farmer_name?: string;
  calamity_name: string;
  date_of_calamity: string;
  damage_percentage: number;
  estimated_value_lost?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  device_id: string;
  photo_base64: string;
  status: QueueStatus;
  error?: string;
  created_at: string;
}

/** Read caches so the field tool works with no connectivity. */
export interface CachedRecord {
  id: string;
  payload: any;
  cached_at: string;
}

class AgriAkapDB extends Dexie {
  pendingDistributions!: Table<PendingDistribution, string>;
  pendingAssessments!: Table<PendingAssessment, string>;
  cachedPrograms!: Table<CachedRecord, string>;
  cachedFarmers!: Table<CachedRecord, string>;
  cachedFarmPlots!: Table<CachedRecord, string>;

  constructor() {
    super('agri-akap');
    this.version(1).stores({
      pendingDistributions: 'client_id, status, created_at',
      pendingAssessments: 'client_id, status, created_at',
      cachedPrograms: 'id, cached_at',
      cachedFarmers: 'id, cached_at',
      cachedFarmPlots: 'id, cached_at',
    });
  }
}

export const db = new AgriAkapDB();

/** Generate a client-side UUID (used as the eventual server PK). */
export function newUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // RFC4122-ish fallback for older webviews.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Stable per-device identifier for audit trails. */
export function getDeviceId(): string {
  const key = 'agri_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'DEV-' + newUuid();
    localStorage.setItem(key, id);
  }
  return id;
}
