/**
 * HBB Unified Auto-Assignment Engine
 *
 * Single source of truth for all installer allocation.
 * Replaces both the old hbb-auto-assign.ts (smartAutoAssign) and the
 * /auto-allocate edge function.
 *
 * Tables used (unified, post-migration):
 *   jobs        — all service requests / leads
 *   installers  — all installers (merged from installers_HBB + INHOUSE_INSTALLER_6TOWNS_MARCH)
 *
 * Scoring model (higher score = better candidate):
 *   Estate match   40% — installer.estate === job.estate_name (exact, case-insensitive)
 *   Workload       30% — fewer active jobs today relative to max_jobs_per_day
 *   Acceptance     20% — completed / (completed + cancelled) in last 30 days
 *   Availability   10% — is_available flag is true
 *
 * Radius fallback (requires job.customer_lat / customer_lng):
 *   Pass 1: estate match
 *   Pass 2: within 2 km of job location
 *   Pass 3: within 5 km of job location
 *   Pass 4: same town, any estate (last resort)
 *
 * Race condition protection:
 *   Optimistic lock — UPDATE jobs SET status='assigned' WHERE id=? AND status='pending'
 *   If 0 rows updated, another process won already → try next candidate.
 *
 * Rejection & re-assignment:
 *   Rejection notes written to jobs.remarks as REJECTED_BY:{id}
 *   After MAX_REJECTIONS the job is escalated to 'pending_escalation'
 *
 * Prerequisites:
 *   npm install @turf/distance @turf/helpers
 */

import { supabase } from '../../utils/supabase/client';

// ─── Turf.js distance ────────────────────────────────────────────────────────
// Imported dynamically so a missing package never crashes an unrelated page load.
type TurfDistance = (from: any, to: any, opts?: { units: string }) => number;
type TurfPoint    = (coords: [number, number]) => any;

let _turfDistance: TurfDistance | null = null;
let _turfPoint:    TurfPoint    | null = null;

async function loadTurf(): Promise<void> {
  if (_turfDistance) return;
  try {
    const [distMod, helpersMod] = await Promise.all([
      import('@turf/distance'),
      import('@turf/helpers'),
    ]);
    _turfDistance = distMod.default ?? distMod.distance;
    _turfPoint    = helpersMod.point;
  } catch {
    // Turf not installed — fall back to inline Haversine below
  }
}

/** Returns distance in kilometres between two lat/lng pairs. */
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  if (_turfDistance && _turfPoint) {
    return _turfDistance(_turfPoint([lng1, lat1]), _turfPoint([lng2, lat2]), { units: 'kilometers' });
  }
  // Haversine fallback (no external dep needed)
  const R  = 6371;
  const dL = (lat2 - lat1) * Math.PI / 180;
  const dN = (lng2 - lng1) * Math.PI / 180;
  const a  = Math.sin(dL / 2) ** 2 +
             Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dN / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


// ─── Constants ───────────────────────────────────────────────────────────────
const WORK_START_HOUR             = 7;
const WORK_END_HOUR               = 18;
const MAX_REJECTIONS              = 3;
const MAX_JOBS_PER_DAY_DEFAULT    = 6;
const RADIUS_TIERS_KM             = [2, 5];   // expand search by these tiers if estate match fails

const WEIGHTS = {
  ESTATE_MATCH: 0.40,
  WORKLOAD:     0.30,
  ACCEPTANCE:   0.20,
  AVAILABILITY: 0.10,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Installer {
  id:               number;
  name:             string;
  phone:            string;
  town:             string | null;
  town_id:          number | null;
  estate:           string | null;
  lat:              number | null;
  lng:              number | null;
  status:           string;
  max_jobs_per_day: number;
  is_available:     boolean;
}

interface ScoredCandidate extends Installer {
  todayCount:     number;
  acceptanceRate: number;
  score:          number;
}

export interface AssignmentResult {
  success:       boolean;
  installerId?:  number;
  installerName?: string;
  escalated?:    boolean;
  error?:        string;
}

// ─── Rejection helpers ────────────────────────────────────────────────────────
function parseRejectedIds(remarks: string | null): string[] {
  if (!remarks) return [];
  return (remarks.match(/REJECTED_BY:([^\s\n|]+)/g) || [])
    .map(m => m.replace('REJECTED_BY:', '').trim());
}

function countRejections(remarks: string | null): number {
  if (!remarks) return 0;
  return (remarks.match(/REJECTED_BY:/g) || []).length;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
function scoreCandidate(
  inst:           Installer,
  job:            { estate_name?: string | null; customer_lat?: number | null; customer_lng?: number | null },
  todayCount:     number,
  acceptanceRate: number,
  radiusKm?:      number,   // undefined = no distance filter applied
): ScoredCandidate | null {

  // Geographic filter
  if (radiusKm !== undefined) {
    // Radius mode: installer must have coords and be within radiusKm of job
    if (!inst.lat || !inst.lng || !job.customer_lat || !job.customer_lng) return null;
    const dist = getDistanceKm(job.customer_lat, job.customer_lng, inst.lat, inst.lng);
    if (dist > radiusKm) return null;
  }

  // Score components
  const estateMatch = (
    !!job.estate_name && !!inst.estate &&
    inst.estate.toLowerCase().trim() === job.estate_name.toLowerCase().trim()
  ) ? 1 : 0;

  const maxPerDay = inst.max_jobs_per_day || MAX_JOBS_PER_DAY_DEFAULT;
  const workloadScore = 1 - Math.min(todayCount, maxPerDay) / maxPerDay;

  const availabilityScore = inst.is_available ? 1 : 0;

  const score =
    estateMatch    * WEIGHTS.ESTATE_MATCH +
    workloadScore  * WEIGHTS.WORKLOAD     +
    acceptanceRate * WEIGHTS.ACCEPTANCE   +
    availabilityScore * WEIGHTS.AVAILABILITY;

  return { ...inst, todayCount, acceptanceRate, score };
}


// ─── Core algorithm ───────────────────────────────────────────────────────────
export async function unifiedAutoAssign(jobId: string): Promise<AssignmentResult> {

  // Working hours guard (07:00–18:00 Nairobi)
  const hour = new Date().getHours();
  if (hour < WORK_START_HOUR || hour >= WORK_END_HOUR) {
    return {
      success: false,
      error: `Outside working hours (${WORK_START_HOUR}:00–${WORK_END_HOUR}:00). Will be assigned when operations resume.`,
    };
  }

  await loadTurf();

  try {
    // ── 1. Load job ──────────────────────────────────────────────────────────
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, status, remarks, town, town_id, estate_name, customer_lat, customer_lng, rejected_by')
      .eq('id', jobId)
      .single();

    if (jobErr || !job) return { success: false, error: 'Job not found' };

    // 'open' is allowed for rows migrated from service_request
    if (!['pending', 'open', 'pending_reassignment'].includes(job.status)) {
      return { success: false, error: `Job not assignable (status: ${job.status})` };
    }

    const rejectedIds   = parseRejectedIds(job.remarks);
    const rejectionCount = countRejections(job.remarks);

    if (rejectionCount >= MAX_REJECTIONS) {
      await supabase.from('jobs').update({ status: 'pending_escalation' }).eq('id', jobId);
      return { success: false, escalated: true, error: `Escalated after ${rejectionCount} rejections` };
    }

    // ── 2. Today's active job counts per installer ───────────────────────────
    const today = new Date().toISOString().split('T')[0];
    const { data: todayRows } = await supabase
      .from('jobs')
      .select('installer_id')
      .in('status', ['assigned', 'on_way', 'arrived'])
      .gte('assigned_at', `${today}T00:00:00`);

    const countMap: Record<number, number> = {};
    (todayRows || []).forEach((r: any) => {
      if (r.installer_id) countMap[r.installer_id] = (countMap[r.installer_id] || 0) + 1;
    });

    // ── 3. Acceptance rates (last 30 days) ───────────────────────────────────
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: historyRows } = await supabase
      .from('jobs')
      .select('installer_id, status')
      .in('status', ['completed', 'cancelled'])
      .gte('assigned_at', since);

    const rateMap: Record<number, { done: number; cancelled: number }> = {};
    (historyRows || []).forEach((r: any) => {
      if (!r.installer_id) return;
      if (!rateMap[r.installer_id]) rateMap[r.installer_id] = { done: 0, cancelled: 0 };
      if (r.status === 'completed') rateMap[r.installer_id].done++;
      else rateMap[r.installer_id].cancelled++;
    });

    // ── 4. Load available installers (same town) ─────────────────────────────
    let instQuery = supabase
      .from('installers')
      .select('id, name, phone, town, town_id, estate, lat, lng, status, max_jobs_per_day, is_available')
      .eq('status', 'available')
      .limit(300);

    // Town filter: prefer town_id FK, fall back to text match
    if (job.town_id) {
      instQuery = instQuery.eq('town_id', job.town_id);
    } else if (job.town) {
      instQuery = instQuery.ilike('town', `%${job.town.trim()}%`);
    }

    const { data: allInstallers } = await instQuery;
    if (!allInstallers?.length) {
      return { success: false, error: `No installers found in ${job.town || 'this town'}` };
    }

    // ── 5. Exclude previously rejected installers ────────────────────────────
    const eligible = allInstallers.filter(inst => {
      const id = String(inst.id);
      if (rejectedIds.includes(id)) return false;
      const maxPerDay = inst.max_jobs_per_day || MAX_JOBS_PER_DAY_DEFAULT;
      return (countMap[inst.id] || 0) < maxPerDay;
    });

    if (!eligible.length) {
      return { success: false, error: 'All installers at capacity or previously rejected this job' };
    }

    // ── 6. Score candidates across multiple passes ───────────────────────────
    // Pass 1: estate match (highest priority)
    let scored: ScoredCandidate[] = eligible
      .map(inst => {
        const r = rateMap[inst.id] || { done: 0, cancelled: 0 };
        const total = r.done + r.cancelled;
        const acceptanceRate = total > 0 ? r.done / total : 0.8;
        return scoreCandidate(inst, job, countMap[inst.id] || 0, acceptanceRate, undefined);
      })
      .filter((c): c is ScoredCandidate => c !== null)
      .filter(c => {
        // Only estate-matched candidates in pass 1
        return !!job.estate_name && !!c.estate &&
          c.estate.toLowerCase().trim() === job.estate_name.toLowerCase().trim();
      })
      .sort((a, b) => b.score - a.score);

    // Pass 2 & 3: radius tiers (only if job has coords)
    if (!scored.length && job.customer_lat && job.customer_lng) {
      for (const radiusKm of RADIUS_TIERS_KM) {
        scored = eligible
          .map(inst => {
            const r = rateMap[inst.id] || { done: 0, cancelled: 0 };
            const total = r.done + r.cancelled;
            const acceptanceRate = total > 0 ? r.done / total : 0.8;
            return scoreCandidate(inst, job, countMap[inst.id] || 0, acceptanceRate, radiusKm);
          })
          .filter((c): c is ScoredCandidate => c !== null)
          .sort((a, b) => b.score - a.score);

        if (scored.length) break;
      }
    }

    // Pass 4: same town, ignore estate / distance (last resort)
    if (!scored.length) {
      scored = eligible
        .map(inst => {
          const r = rateMap[inst.id] || { done: 0, cancelled: 0 };
          const total = r.done + r.cancelled;
          const acceptanceRate = total > 0 ? r.done / total : 0.8;
          return scoreCandidate(inst, job, countMap[inst.id] || 0, acceptanceRate, undefined);
        })
        .filter((c): c is ScoredCandidate => c !== null)
        .sort((a, b) => b.score - a.score);
    }

    if (!scored.length) {
      return { success: false, error: `No suitable installer found in ${job.town || 'this area'}` };
    }

    // ── 7. Try each candidate with optimistic lock ───────────────────────────
    for (const best of scored) {
      const { error: updateErr, count: updateCount } = await supabase
        .from('jobs')
        .update({
          installer_id: best.id,
          status:       'assigned',
          assigned_at:  new Date().toISOString(),
        })
        .eq('id', jobId)
        .in('status', ['pending', 'open']);   // optimistic lock — also covers migrated SR rows

      if (updateErr) {
        console.warn(`[UnifiedAssign] Lock failed for installer ${best.id}:`, updateErr.message);
        continue;
      }

      if ((updateCount ?? 0) === 0) {
        // Another process assigned it first
        return { success: false, error: 'Job was assigned by another process (race condition handled)' };
      }

      // Mark installer busy
      await supabase
        .from('installers')
        .update({ is_available: false, current_job_id: String(jobId) })
        .eq('id', best.id);

      console.log(
        `[UnifiedAssign] Job ${jobId} → ${best.name} (id:${best.id}) ` +
        `score:${best.score.toFixed(2)} workload:${best.todayCount}/${best.max_jobs_per_day}`
      );

      return { success: true, installerId: best.id, installerName: best.name };
    }

    return { success: false, error: 'All eligible installers failed assignment (possible race conditions)' };

  } catch (err: any) {
    console.error('[UnifiedAssign] Error:', err);
    return { success: false, error: err.message };
  }
}


// ─── Rejection + re-assign ────────────────────────────────────────────────────
export async function recordRejectionAndReassign(
  job:           { id: string; remarks?: string | null; town?: string; estate_name?: string },
  installerId:   number,
  installerName: string,
  reason:        string,
): Promise<AssignmentResult> {
  try {
    const ts = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
    const note = `\nREJECTED_BY:${installerId} (${installerName}) at ${ts}\nReason: ${reason}`;

    // Reset job to pending with rejection note appended
    await supabase
      .from('jobs')
      .update({ status: 'pending', installer_id: null, remarks: (job.remarks || '') + note })
      .eq('id', job.id);

    // Free installer
    await supabase
      .from('installers')
      .update({ is_available: true, current_job_id: null })
      .eq('id', installerId);

    return unifiedAutoAssign(job.id);

  } catch (err: any) {
    console.error('[UnifiedAssign] Rejection/reassign error:', err);
    return { success: false, error: err.message };
  }
}


// ─── Bulk assign all pending jobs ─────────────────────────────────────────────
export async function bulkAutoAssign(): Promise<{ assigned: number; failed: number; errors: string[] }> {
  const { data: pending } = await supabase
    .from('jobs')
    .select('id')
    .eq('status', 'pending')
    .limit(50);

  let assigned = 0, failed = 0;
  const errors: string[] = [];

  for (const job of pending || []) {
    const result = await unifiedAutoAssign(String(job.id));
    if (result.success) assigned++;
    else {
      failed++;
      if (result.error) errors.push(`Job ${job.id}: ${result.error}`);
    }
    // Throttle to avoid Supabase rate limits
    await new Promise(r => setTimeout(r, 100));
  }

  return { assigned, failed, errors };
}


// ─── Legacy exports (keep existing call sites working during transition) ──────
/** @deprecated Use unifiedAutoAssign instead */
export const smartAutoAssign = (jobId: string, _town: string, _estate?: string) =>
  unifiedAutoAssign(jobId);
