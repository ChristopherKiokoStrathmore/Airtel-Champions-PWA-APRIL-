/**
 * ODU Allocation Engine
 *
 * Parameterized fork of hbb-auto-assign.ts, tuned for retrieval:
 *   - Candidates must have installers.odu_opt_in = true (drives the TL opt-in loop)
 *   - DISTANCE-FIRST scoring (the workflow allocates "by lat/long")
 *   - Radius tiers come from odu_config.radius_tiers_km (default 2/5/10 km)
 *   - Optimistic-lock claim via the odu_allocate_lock SECURITY DEFINER RPC
 *     (direct UPDATE is blocked by RLS — writes must go through RPCs)
 *   - Workload counts BOTH open odu_requests and active installation jobs so an
 *     installer doing both is not double-booked.
 *
 * The 48h acceptance deadline + timeout re-allocation is handled server-side by
 * odu_sweep_expired() (pg_cron). This engine only allocates 'confirmed' requests.
 */
import { supabase } from '../../utils/supabase/client';
import { getOduConfig } from './odu-api';

const MAX_JOBS_PER_DAY_DEFAULT = 6;
const DEFAULT_RADIUS_TIERS = [2, 5, 10];

const WEIGHTS = { DISTANCE: 0.50, WORKLOAD: 0.25, ACCEPTANCE: 0.15, AVAILABILITY: 0.10 } as const;

interface Installer {
  id: number; name: string; phone: string;
  town: string | null; town_id: number | null; estate: string | null;
  lat: number | null; lng: number | null;
  status: string; max_jobs_per_day: number; is_available: boolean;
}

export interface OduAssignmentResult {
  success: boolean;
  installerId?: number;
  installerName?: string;
  escalated?: boolean;
  error?: string;
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dL = (lat2 - lat1) * Math.PI / 180;
  const dN = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dL / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dN / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function allocateOduRequest(requestId: string): Promise<OduAssignmentResult> {
  try {
    const cfg = await getOduConfig();
    const tiers: number[] = Array.isArray(cfg.radius_tiers_km) ? cfg.radius_tiers_km : DEFAULT_RADIUS_TIERS;

    // 1. Load request
    const { data: req, error: reqErr } = await supabase
      .from('odu_requests')
      .select('id, status, rejected_by, rejection_count, customer_id, customer_lat, customer_lng, ' +
              'customer:odu_inactive_customers!odu_requests_customer_id_fkey(town, estate, lat, lng)')
      .eq('id', requestId).single();
    if (reqErr || !req) return { success: false, error: 'Request not found' };
    if (req.status !== 'confirmed') return { success: false, error: `Not allocatable (status: ${req.status})` };

    const cust: any = req.customer;
    const jobLat = req.customer_lat ?? cust?.lat ?? null;
    const jobLng = req.customer_lng ?? cust?.lng ?? null;
    const jobTown: string | null = cust?.town ?? null;
    const jobEstate: string | null = cust?.estate ?? null;
    const rejected: number[] = req.rejected_by || [];

    // 2. Opt-in installers, same town
    let q = supabase
      .from('installers')
      .select('id, name, phone, town, town_id, estate, lat, lng, status, max_jobs_per_day, is_available')
      .eq('odu_opt_in', true).eq('status', 'available').limit(300);
    if (jobTown) q = q.ilike('town', `%${jobTown.trim()}%`);
    const { data: installers } = await q;
    if (!installers?.length) return { success: false, error: `No opted-in installers in ${jobTown || 'this town'}` };

    // 3. Workload: open odu_requests + active jobs per installer today
    const today = new Date().toISOString().split('T')[0];
    const [{ data: oduRows }, { data: jobRows }] = await Promise.all([
      supabase.from('odu_requests').select('installer_id').in('status', ['allocated', 'accepted']),
      supabase.from('jobs').select('installer_id').in('status', ['assigned', 'on_way', 'arrived'])
        .gte('assigned_at', `${today}T00:00:00`),
    ]);
    const countMap: Record<number, number> = {};
    [...(oduRows || []), ...(jobRows || [])].forEach((r: any) => {
      if (r.installer_id) countMap[r.installer_id] = (countMap[r.installer_id] || 0) + 1;
    });

    // 4. Acceptance rate over odu history (last 30d)
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const { data: hist } = await supabase.from('odu_requests')
      .select('installer_id, status').in('status', ['collected', 'delivered', 'payable', 'paid', 'not_recovered'])
      .gte('updated_at', since);
    const rate: Record<number, { done: number; total: number }> = {};
    (hist || []).forEach((r: any) => {
      if (!r.installer_id) return;
      rate[r.installer_id] = rate[r.installer_id] || { done: 0, total: 0 };
      rate[r.installer_id].total++;
      if (r.status !== 'not_recovered') rate[r.installer_id].done++;
    });

    // 5. Eligible = opted-in, not rejected, under capacity
    const eligible = (installers as Installer[]).filter(inst => {
      if (rejected.includes(inst.id)) return false;
      const max = inst.max_jobs_per_day || MAX_JOBS_PER_DAY_DEFAULT;
      return (countMap[inst.id] || 0) < max;
    });
    if (!eligible.length) return { success: false, error: 'All opted-in installers at capacity or excluded' };

    const scoreOf = (inst: Installer, distanceScore: number): number => {
      const max = inst.max_jobs_per_day || MAX_JOBS_PER_DAY_DEFAULT;
      const workload = 1 - Math.min(countMap[inst.id] || 0, max) / max;
      const r = rate[inst.id];
      const acceptance = r && r.total > 0 ? r.done / r.total : 0.8;
      const availability = inst.is_available ? 1 : 0;
      return distanceScore * WEIGHTS.DISTANCE + workload * WEIGHTS.WORKLOAD +
        acceptance * WEIGHTS.ACCEPTANCE + availability * WEIGHTS.AVAILABILITY;
    };

    // 6. Build ranked candidate list.
    type Scored = { inst: Installer; score: number };
    let scored: Scored[] = [];

    if (jobLat != null && jobLng != null) {
      // Distance-first: try each radius tier, keep those within, score by proximity.
      for (const radius of tiers) {
        const within = eligible
          .filter(i => i.lat != null && i.lng != null &&
            getDistanceKm(jobLat, jobLng, i.lat!, i.lng!) <= radius)
          .map(i => {
            const d = getDistanceKm(jobLat, jobLng, i.lat!, i.lng!);
            const distanceScore = 1 - Math.min(d, radius) / radius; // closer = higher
            return { inst: i, score: scoreOf(i, distanceScore) };
          });
        if (within.length) { scored = within.sort((a, b) => b.score - a.score); break; }
      }
    }

    // Fallbacks when no coords / nobody in radius: estate match, then town-any.
    if (!scored.length) {
      const estateMatch = eligible.filter(i =>
        jobEstate && i.estate && i.estate.toLowerCase().trim() === jobEstate.toLowerCase().trim());
      const pool = estateMatch.length ? estateMatch : eligible;
      scored = pool.map(i => ({ inst: i, score: scoreOf(i, estateMatch.length ? 0.6 : 0.2) }))
        .sort((a, b) => b.score - a.score);
    }

    if (!scored.length) return { success: false, error: 'No suitable installer found' };

    // 7. Claim with optimistic lock (RPC). Try candidates in order.
    for (const { inst } of scored) {
      const { data: locked, error } = await supabase.rpc('odu_allocate_lock', {
        p_request: requestId, p_installer_id: inst.id, p_installer_name: inst.name,
      });
      if (error) { console.warn('[ODU-Assign] lock error', error.message); continue; }
      if (locked === true) {
        console.log(`[ODU-Assign] ${requestId} → ${inst.name} (id:${inst.id})`);
        return { success: true, installerId: inst.id, installerName: inst.name };
      }
      // locked=false → someone else claimed it first (or status changed) → stop.
      return { success: false, error: 'Request was allocated by another process' };
    }
    return { success: false, error: 'All candidates failed to lock' };
  } catch (err: any) {
    console.error('[ODU-Assign] error', err);
    return { success: false, error: err.message };
  }
}

/** Allocate every 'confirmed' request. Call on HQ/CX dashboard load or via a button. */
export async function bulkAllocateOdu(): Promise<{ allocated: number; failed: number; errors: string[] }> {
  const { data: confirmed } = await supabase
    .from('odu_requests').select('id').eq('status', 'confirmed').limit(200);
  let allocated = 0, failed = 0; const errors: string[] = [];
  for (const r of confirmed || []) {
    const res = await allocateOduRequest(String(r.id));
    if (res.success) allocated++;
    else { failed++; if (res.error) errors.push(`${r.id}: ${res.error}`); }
    await new Promise(res => setTimeout(res, 80)); // throttle
  }
  return { allocated, failed, errors };
}
