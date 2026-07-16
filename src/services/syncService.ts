import apiClient from '@/utils/axios';
import {
  db,
  getDeviceId,
  newUuid,
  pendingQueueCount,
  type PendingAssessment,
  type PendingDistribution,
} from './db';

export interface SyncOutcome {
  client_id: string | null;
  outcome: 'synced' | 'duplicate' | 'failed';
  message: string;
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

/* ----------------------------- Read caching ----------------------------- */

async function cacheAll(
  table: 'cachedPrograms' | 'cachedFarmers' | 'cachedFarmPlots',
  records: any[],
) {
  const now = new Date().toISOString();
  const rows = records
    .filter((r) => r && r.id)
    .map((r) => ({ id: r.id, payload: r, cached_at: now }));
  await db[table].clear();
  await db[table].bulkPut(rows);
}

/** Fetch programs, caching them for offline use; fall back to cache when offline. */
export async function getPrograms(): Promise<any[]> {
  if (isOnline()) {
    try {
      const res = await apiClient.get('/programs', { params: { active_only: true } });
      const list = res.data?.data?.data ?? res.data?.data ?? [];
      await cacheAll('cachedPrograms', list);
      return list;
    } catch {
      /* fall through to cache */
    }
  }
  return (await db.cachedPrograms.toArray()).map((r) => r.payload);
}

/** Resolve a scanned farmer QR to their profile + plots, using cache when offline. */
export async function lookupFarmer(qr: string): Promise<any | null> {
  const value = qr.trim();
  if (isOnline()) {
    try {
      const res = await apiClient.get('/farmers/lookup', { params: { qr: value } });
      const farmer = res.data?.data;
      if (farmer) {
        await db.cachedFarmers.put({ id: farmer.id, payload: farmer, cached_at: new Date().toISOString() });
        for (const plot of farmer.farm_plots ?? farmer.farmPlots ?? []) {
          await db.cachedFarmPlots.put({ id: plot.id, payload: plot, cached_at: new Date().toISOString() });
        }
      }
      return farmer ?? null;
    } catch {
      /* fall through to cache */
    }
  }
  const cached = await db.cachedFarmers.get(value);
  return cached ? cached.payload : null;
}

/* ------------------------------- Queueing ------------------------------- */

export async function queueDistribution(input: {
  farmer_id: string;
  farmer_name?: string;
  program_id: string;
  program_name?: string;
  geo_tag_lat?: number | null;
  geo_tag_long?: number | null;
  photo_proof_base64?: string;
}): Promise<PendingDistribution> {
  const record: PendingDistribution = {
    client_id: newUuid(),
    farmer_id: input.farmer_id,
    farmer_name: input.farmer_name,
    program_id: input.program_id,
    program_name: input.program_name,
    geo_tag_lat: input.geo_tag_lat ?? null,
    geo_tag_long: input.geo_tag_long ?? null,
    photo_proof_base64: input.photo_proof_base64,
    device_id: getDeviceId(),
    claimed_at: new Date().toISOString(),
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  await db.pendingDistributions.put(record);
  return record;
}

export async function queueAssessment(
  input: Omit<PendingAssessment, 'client_id' | 'device_id' | 'status' | 'created_at'>,
): Promise<PendingAssessment> {
  const record: PendingAssessment = {
    ...input,
    client_id: newUuid(),
    device_id: getDeviceId(),
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  await db.pendingAssessments.put(record);
  return record;
}

export async function pendingCount(): Promise<number> {
  return pendingQueueCount();
}

/* ------------------------------- Flushing ------------------------------- */

let flushing = false;

/**
 * Push all queued records to the Laravel bulk-sync endpoint and reconcile
 * the local queue based on the per-item outcome:
 *   synced / duplicate -> remove from queue (server now owns the record)
 *   failed             -> keep and flag so the technician can retry
 */
export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  if (flushing || !isOnline()) {
    return { synced: 0, failed: 0 };
  }
  flushing = true;

  try {
    const distributions = await db.pendingDistributions.toArray();
    const assessments = await db.pendingAssessments.toArray();

    if (distributions.length === 0 && assessments.length === 0) {
      return { synced: 0, failed: 0 };
    }

    await db.pendingDistributions.toCollection().modify({ status: 'syncing' });
    await db.pendingAssessments.toCollection().modify({ status: 'syncing' });

    const payload = {
      device_id: getDeviceId(),
      distributions: distributions.map((d) => ({
        client_id: d.client_id,
        farmer_id: d.farmer_id,
        program_id: d.program_id,
        device_id: d.device_id,
        claimed_at: d.claimed_at,
        geo_tag_lat: d.geo_tag_lat,
        geo_tag_long: d.geo_tag_long,
        photo_proof_base64: d.photo_proof_base64,
      })),
      assessments: assessments.map((a) => ({
        id: a.client_id,
        farm_plot_id: a.farm_plot_id,
        farmer_id: a.farmer_id,
        calamity_type: a.calamity_type,
        calamity_name: a.calamity_name,
        crop_stage: a.crop_stage,
        area_destroyed_ha: a.area_destroyed_ha,
        date_of_calamity: a.date_of_calamity,
        damage_percentage: a.damage_percentage,
        estimated_value_lost: a.estimated_value_lost,
        latitude: a.latitude,
        longitude: a.longitude,
        device_id: a.device_id,
        photo_base64: a.photo_base64,
      })),
    };

    const res = await apiClient.post('/sync/bulk', payload);
    const results = res.data?.results ?? { distributions: [], assessments: [] };

    let synced = 0;
    let failed = 0;

    for (const r of results.distributions as SyncOutcome[]) {
      if (r.outcome === 'synced' || r.outcome === 'duplicate') {
        await db.pendingDistributions.delete(r.client_id as string);
        synced++;
      } else {
        failed++;
        await db.pendingDistributions.update(r.client_id as string, {
          status: 'failed',
          error: r.message,
        });
      }
    }

    for (const r of results.assessments as SyncOutcome[]) {
      if (r.outcome === 'synced' || r.outcome === 'duplicate') {
        await db.pendingAssessments.delete(r.client_id as string);
        synced++;
      } else {
        failed++;
        await db.pendingAssessments.update(r.client_id as string, {
          status: 'failed',
          error: r.message,
        });
      }
    }

    return { synced, failed };
  } catch (e: any) {
    // Network/server error: revert to pending so items are retried later.
    await db.pendingDistributions.where('status').equals('syncing').modify({ status: 'pending' });
    await db.pendingAssessments.where('status').equals('syncing').modify({ status: 'pending' });
    return { synced: 0, failed: 0 };
  } finally {
    flushing = false;
  }
}
