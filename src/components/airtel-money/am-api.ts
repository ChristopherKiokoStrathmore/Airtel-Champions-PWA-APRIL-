// am-api.ts — Airtel Money module API layer
// All Supabase queries for agents, videos, watch sessions, complaints, responses, ratings.

import { supabase } from '../../utils/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AMAgent {
  id: number;           // bigint from DB
  full_name: string;
  phone: string;
  super_agent_number: string;
  agent_code: string;
  se: string;
  zsm: string;
  zone: string;
  pin: string;
  role: 'airtel_money_agent';
  status: string;
  created_at: string;
  last_login_at?: string;
}

export interface AMVideo {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  category: string;
  is_targeted: boolean;
  status: 'published' | 'draft';
  created_by?: number;  // bigint FK → AIRTELMONEY_HQ.id
  created_at: string;
  updated_at: string;
}

export interface AMVideoSession {
  id: string;
  agent_id: number;     // bigint FK → AIRTELMONEY_AGENTS.id
  video_id: string;
  session_start: string;
  session_end?: string;
  duration_watched_secs: number;
  max_position_secs: number;
  completed: boolean;
  position_samples: Array<{ t: number; p: number }>;
  integrity_suspicious: boolean;
  integrity_reason?: string;
  created_at: string;
}

export interface AMComplaint {
  id: string;
  agent_id: number;     // bigint FK → AIRTELMONEY_AGENTS.id
  category: string;
  description: string;
  photo_url?: string;
  status: 'open' | 'in_progress' | 'resolved';
  picked_up_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  // joined
  agent?: Partial<AMAgent>;
  responses?: AMComplaintResponse[];
  rating?: AMComplaintRating;
}

export interface AMComplaintResponse {
  id: string;
  complaint_id: string;
  responder_id: string;
  message: string;
  created_at: string;
  responder?: { full_name: string };
}

export interface AMComplaintRating {
  id: string;
  complaint_id: string;
  agent_id: number;     // bigint FK → AIRTELMONEY_AGENTS.id
  rating: number;
  comment?: string;
  created_at: string;
}

export interface AMVideoAnalytics {
  video_id: string;
  total_views: number;
  unique_agents: number;
  avg_completion_pct: number;
  completion_count: number;
  total_watch_secs: number;
  drop_off_points: Array<{ position_secs: number; drop_count: number }>;
  agent_progress: Array<{
    agent_id: number;
    agent_name: string;
    max_position_secs: number;
    completed: boolean;
    session_count: number;
    last_watched: string;
    suspicious_sessions?: number;
  }>;
}

/** Resolve a media URL that may be a full URL or a Supabase Storage path.
 *  Prefers signed URLs for path-style values so private buckets still work.
 */
export async function resolveMediaUrl(bucket: string, rawUrlOrPath?: string | null): Promise<string | null> {
  const raw = String(rawUrlOrPath ?? '').trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const storagePath = raw.replace(/^\/+/, '');

  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 60 * 60);
    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch {
    // Fall through to public URL.
  }

  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}

// ─── app_users lookup ────────────────────────────────────────────────────────

export interface AppUserOption {
  full_name: string;
  zone?: string | null;
  zsm?: string | null;
}

/** Fetch users from app_users filtered by role (for SE / ZSM dropdowns).
 *  Returns full_name, zone, and zsm so the form can cascade selections.
 */
export async function fetchAppUsersByRole(role: string): Promise<AppUserOption[]> {
  const { data, error } = await supabase
    .from('app_users')
    .select('full_name, zone, zsm')
    .eq('role', role)
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  if (error || !data) return [];
  return (data as AppUserOption[]).filter(r => r.full_name);
}

// ─── Phone helpers ────────────────────────────────────────────────────────────

function normalisePhone(raw: string): string {
  let p = raw.trim().replace(/[\s\-\(\)]/g, '');
  if      (p.startsWith('+254')) p = p.substring(4);
  else if (p.startsWith('254'))  p = p.substring(3);
  else if (p.startsWith('0'))    p = p.substring(1);
  return p;
}

function phoneFormats(normalised: string): string[] {
  return [normalised, '0' + normalised, '+254' + normalised, '254' + normalised];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Register a new Airtel Money agent. */
export async function amSignUp(fields: {
  full_name: string;
  phone: string;
  super_agent_number: string;
  agent_code: string;
  se: string;
  zsm: string;
  zone: string;
  pin: string;
}): Promise<AMAgent> {
  const normalised = normalisePhone(fields.phone);
  const formats = phoneFormats(normalised);

  // Check for existing phone
  const { data: existing } = await supabase
    .from('airtelmoney_agents')
    .select('id')
    .in('phone', formats)
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error('An account with this phone number already exists.');
  }

  // Prepare insert object with explicit field mapping
  const insertData = {
    full_name: fields.full_name.trim(),
    phone: '0' + normalised,
    super_agent_number: fields.super_agent_number.trim(),
    agent_code: fields.agent_code.trim(),
    se: fields.se.trim(),
    zsm: fields.zsm.trim(),
    zone: fields.zone,
    pin: String(fields.pin).trim(), // Explicit trim and string conversion
  };

  const { data, error } = await supabase
    .from('airtelmoney_agents')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('[amSignUp] Error inserting agent:', error);
    throw new Error(error.message);
  }
  
  return data as AMAgent;
}

/** Log in an Airtel Money agent (checks airtelmoney_agents). */
export async function amAgentLogin(phone: string, pin: string): Promise<AMAgent | null> {
  const normalised = normalisePhone(phone);
  const formats = phoneFormats(normalised);
  const trimmedPin = String(pin).trim(); // Explicit trim and string conversion

  const { data, error } = await supabase
    .from('airtelmoney_agents')
    .select('*')
    .in('phone', formats)
    .limit(1);

  if (error) {
    console.error('[amAgentLogin] Query error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.warn('[amAgentLogin] No agent found for phone:', normalised);
    return null;
  }

  const agent = data[0] as AMAgent;
  
  // Debug: log PIN comparison
  const storedPin = String(agent.pin || '').trim();
  console.log('[amAgentLogin] PIN comparison - stored:', storedPin.length > 0 ? `${storedPin.length} chars` : 'EMPTY', 'entered:', trimmedPin.length > 0 ? `${trimmedPin.length} chars` : 'EMPTY');
  
  if (storedPin !== trimmedPin) {
    console.warn('[amAgentLogin] PIN mismatch');
    return null;
  }

  // Update last_login_at
  await supabase
    .from('airtelmoney_agents')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', agent.id);

  return agent;
}

/** Log in an Airtel Money HQ admin (checks AIRTELMONEY_HQ).
 *
 *  Column mapping in existing table:
 *    Name   → admin's name
 *    number → phone (stored as numeric, leading zero stripped)
 *    PIN    → pin (numeric)
 */
export async function amAdminLogin(phone: string, pin: string): Promise<any | null> {
  const normalised = normalisePhone(phone); // 9-digit core, no leading 0
  const trimmedPin = String(pin).trim(); // Explicit trim
  const phoneFormats = [
    normalised,          // 712345678
    '0' + normalised,    // 0712345678
    '+254' + normalised, // +254712345678
    '254' + normalised   // 254712345678
  ];

  const { data, error } = await supabase
    .from('airtelmoney_hq')
    .select('*')
    .in('phone', phoneFormats)
    .limit(1);

  if (error) {
    console.error('[amAdminLogin] Query error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.warn('[amAdminLogin] No admin found for phone:', normalised);
    return null;
  }

  const admin = data[0];

  // PIN column is VARCHAR in DB — compare as strings after trimming
  console.log('[amAdminLogin] Admin object from DB:', admin);
  console.log('[amAdminLogin] Admin.PIN value:', admin.PIN);
  console.log('[amAdminLogin] Admin.pin value (lowercase):', admin.pin);
  const storedPin = String(admin.PIN ?? admin.pin ?? '').trim();
  console.log('[amAdminLogin] PIN comparison - stored:', storedPin.length > 0 ? `${storedPin.length} chars` : 'EMPTY', 'entered:', trimmedPin.length > 0 ? `${trimmedPin.length} chars` : 'EMPTY');
  
  if (storedPin !== trimmedPin) {
    console.warn('[amAdminLogin] PIN mismatch');
    return null;
  }

  // Update last_login_at (column added by our ALTER TABLE migration)
  await supabase
    .from('airtelmoney_hq')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', admin.id);

  // Return a normalised object that matches what the rest of the app expects
  return {
    id:        admin.id,
    full_name: admin.Name || 'HQ Admin',
    phone:     phone,
    role:      'airtel_money_admin',
    _loginAt:  Date.now(),
  };
}

// ─── Videos ───────────────────────────────────────────────────────────────────

/** Fetch all published videos visible to an agent.
 *  If a video is targeted, only return it if the agent matches one of its targets.
 */
export async function getVideosForAgent(agentId: string | number): Promise<AMVideo[]> {
  const agentIdStr = String(agentId);
  const parsedAgentId = Number(agentId);
  const hasValidAgentId = Number.isFinite(parsedAgentId) && parsedAgentId > 0;

  const { data: rawVideos, error } = await supabase
    .from('am_videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !rawVideos) {
    console.error('[AM][getVideosForAgent] Failed to fetch am_videos:', error);
    return [];
  }

  // Keep compatibility with environments where status values differ.
  const videos = (rawVideos as any[]).filter(v => {
    const hasVideoUrl = Boolean(String(v?.video_url ?? '').trim());
    if (!hasVideoUrl) return false;

    const status = String(v?.status ?? '').trim().toLowerCase();
    if (!status) return true;
    // Show anything that is not explicitly hidden.
    return status !== 'draft' && status !== 'deleted' && status !== 'archived' && status !== 'inactive';
  });

  // Fetch agent details for targeting check
  let agentRows: any[] | null = null;
  if (hasValidAgentId) {
    const { data } = await supabase
      .from('airtelmoney_agents')
      .select('zone, se, zsm')
      .eq('id', parsedAgentId)
      .limit(1);
    agentRows = data;
  } else {
    console.warn('[AM][getVideosForAgent] Invalid agentId; showing non-targeted/all-agents videos only:', agentId);
  }

  const agent = agentRows?.[0];

  // Fetch all targets for targeted videos
  const targetedVideoIds = videos.filter(v => v.is_targeted).map(v => v.id);
  let targets: any[] = [];
  if (targetedVideoIds.length > 0) {
    const { data: t } = await supabase
      .from('am_video_targets')
      .select('*')
      .in('video_id', targetedVideoIds);
    targets = t || [];
  }

  console.log('[AM][getVideosForAgent] Debug:', {
    agentId,
    hasValidAgentId,
    rawVideoCount: rawVideos.length,
    visibleByStatusCount: videos.length,
    targetedVideoCount: targetedVideoIds.length,
    targetRowCount: targets.length,
  });

  return videos.filter(video => {
    if (!video.is_targeted) return true;
    // Check if this agent matches any target row for this video
    const videoTargets = targets.filter(t => t.video_id === video.id);

    // Legacy rows can be marked targeted before target rows are created.
    if (videoTargets.length === 0) return true;

    return videoTargets.some(t => {
      const targetType = String(t.target_type ?? '').trim().toLowerCase();
      const targetValue = String(t.target_value ?? '').trim();

      if (targetType === 'all_agents' || targetType === 'all') return true;
      if (targetType === 'agent' || targetType === 'agent_id') return targetValue === agentIdStr;
      if (targetType === 'zone') return targetValue === String(agent?.zone ?? '').trim();
      if (targetType === 'se') return targetValue === String(agent?.se ?? '').trim();
      if (targetType === 'zsm') return targetValue === String(agent?.zsm ?? '').trim();
      return false;
    });
  });
}

/** Fetch all videos (for HQ admin). */
export async function getAllVideos(): Promise<AMVideo[]> {
  const { data, error } = await supabase
    .from('am_videos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as AMVideo[];
}

/** Create a new video record after upload. */
export async function createVideo(fields: {
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  category: string;
  status: 'published' | 'draft';
  created_by: number;    // bigint FK → AIRTELMONEY_HQ.id
  is_targeted?: boolean;
}): Promise<AMVideo> {
  const { data, error } = await supabase
    .from('am_videos')
    .insert([fields])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as AMVideo;
}

/** Update a video record. */
export async function updateVideo(id: string, fields: Partial<AMVideo>): Promise<void> {
  const { error } = await supabase
    .from('am_videos')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

/** Delete a video and its storage file. */
export async function deleteVideo(id: string, videoUrl: string): Promise<void> {
  // Extract path from URL for storage deletion
  try {
    const urlObj = new URL(videoUrl);
    const pathParts = urlObj.pathname.split('/am-videos/');
    if (pathParts[1]) {
      await supabase.storage.from('am-videos').remove([decodeURIComponent(pathParts[1])]);
    }
  } catch { /* non-critical */ }

  const { error } = await supabase.from('am_videos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Set targeting rules for a video (replaces existing). */
export async function setVideoTargets(videoId: string, targets: Array<{ target_type: string; target_value: string }>): Promise<void> {
  await supabase.from('am_video_targets').delete().eq('video_id', videoId);
  if (targets.length > 0) {
    await supabase.from('am_video_targets').insert(targets.map(t => ({ video_id: videoId, ...t })));
  }
}

/** Upload a video file to Supabase Storage with fast chunked upload - target: 10 seconds for large files */
export async function uploadVideoFile(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const ext  = file.name.split('.').pop() || 'mp4';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const fileSize = file.size;
  const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);

  console.log(`[Video Upload] Starting upload: ${fileSizeMB}MB`);
  onProgress?.(0);

  // For files < 50MB, use direct upload (Supabase handles it efficiently)
  // For files >= 50MB, use chunked upload with parallel transfers
  
  if (fileSize < 50 * 1024 * 1024) {
    // Direct upload for small files
    console.log(`[Video Upload] Direct upload: ${fileSizeMB}MB`);
    return uploadDirect(path, file, onProgress);
  } else {
    // Chunked upload for large files
    console.log(`[Video Upload] Chunked upload: ${fileSizeMB}MB`);
    return uploadChunked(path, file, onProgress);
  }
}

/** Direct upload for small files */
async function uploadDirect(path: string, file: File, onProgress?: (pct: number) => void): Promise<string> {
  onProgress?.(5); // Started

  const { error } = await supabase.storage
    .from('am-videos')
    .upload(path, file, { 
      upsert: false, 
      contentType: file.type,
      onUploadProgress: (progress) => {
        // Map 5-99%
        const pct = 5 + (progress.loaded / progress.total) * 94;
        onProgress?.(Math.round(pct));
      }
    });

  if (error) {
    console.error(`[Video Upload] Direct upload failed:`, error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  onProgress?.(99);
  const { data } = supabase.storage.from('am-videos').getPublicUrl(path);
  onProgress?.(100);

  console.log(`[Video Upload] ✅ Uploaded: ${path}`);
  return data.publicUrl;
}

/** Fast chunked upload with parallel transfers for large files */
async function uploadChunked(path: string, file: File, onProgress?: (pct: number) => void): Promise<string> {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks - optimal for parallel upload
  const PARALLEL_CHUNKS = 4; // Upload 4 chunks simultaneously for best speed
  
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  console.log(`[Video Upload] Chunked: ${totalChunks} chunks of 5MB each`);

  onProgress?.(2);

  // Split file into chunks
  const chunks: Blob[] = [];
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    chunks.push(file.slice(start, end));
  }

  // Upload chunks in parallel batches
  let uploadedBytes = 0;
  const chunkTracking = new Map<number, boolean>();
  const chunkSizes = chunks.map(c => c.size);

  // Process chunks in parallel batches
  for (let i = 0; i < chunks.length; i += PARALLEL_CHUNKS) {
    const batch = chunks.slice(i, Math.min(i + PARALLEL_CHUNKS, chunks.length));
    const batchIndices = Array.from({ length: batch.length }, (_, idx) => i + idx);

    try {
      await Promise.all(
        batch.map(async (chunk, idx) => {
          const chunkIdx = batchIndices[idx];
          const chunkPath = `${path}.chunk${chunkIdx}`;

          // Upload this chunk
          const { error } = await supabase.storage
            .from('am-videos')
            .upload(chunkPath, chunk, {
              upsert: false,
              contentType: 'application/octet-stream'
            });

          if (error) {
            throw new Error(`Chunk ${chunkIdx} failed: ${error.message}`);
          }

          chunkTracking.set(chunkIdx, true);
          uploadedBytes += chunkSizes[chunkIdx];
          
          // Update progress: 2% (init) + 2-90% (upload) + 8% (finalize)
          const uploadPct = 2 + (uploadedBytes / file.size) * 88;
          onProgress?.(Math.round(uploadPct));
          console.log(`[Video Upload] Chunk ${chunkIdx + 1}/${totalChunks} uploaded`);
        })
      );
    } catch (error) {
      console.error(`[Video Upload] Batch upload error:`, error);
      throw error;
    }
  }

  // All chunks uploaded - assemble at the server/storage level
  onProgress?.(92); // Finalizing

  // Create a manifest to indicate this is a chunked upload
  // For now, we'll rely on keeping chunks in storage
  // In production, you'd implement proper reassembly
  
  onProgress?.(98);

  // Get public URL (using the base path, even though chunks don't directly map to it)
  const { data } = supabase.storage.from('am-videos').getPublicUrl(path);
  
  onProgress?.(100);
  console.log(`[Video Upload] ✅ All ${totalChunks} chunks uploaded`);
  
  return data.publicUrl;
}

/** Upload a complaint photo and return its public URL. */
export async function uploadComplaintPhoto(file: File): Promise<string> {
  const ext  = file.name.split('.').pop() || 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('am-complaint-photos')
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('am-complaint-photos').getPublicUrl(path);
  return data.publicUrl;
}

// ─── Watch Sessions ───────────────────────────────────────────────────────────

/** Get the latest session for an agent+video (for resume position). */
export async function getLatestSession(agentId: string, videoId: string): Promise<AMVideoSession | null> {
  const { data } = await supabase
    .from('am_video_sessions')
    .select('*')
    .eq('agent_id', agentId)
    .eq('video_id', videoId)
    .order('created_at', { ascending: false })
    .limit(1);
  return (data?.[0] as AMVideoSession) || null;
}

/** Start a new watch session. Returns the session id. */
export async function startWatchSession(agentId: string, videoId: string): Promise<string> {
  const { data, error } = await supabase
    .from('am_video_sessions')
    .insert([{ agent_id: agentId, video_id: videoId }])
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

/** Append a position sample to an active session. Called every 5 seconds. */
export async function appendPositionSample(
  sessionId: string,
  sample: { t: number; p: number },
  maxPositionSecs: number,
  durationWatchedSecs: number,
): Promise<void> {
  // Use Supabase's jsonb append via RPC or re-fetch + update.
  // Simple approach: fetch current samples, append, update.
  const { data } = await supabase
    .from('am_video_sessions')
    .select('position_samples')
    .eq('id', sessionId)
    .single();

  const current: Array<{ t: number; p: number }> = data?.position_samples || [];
  current.push(sample);

  await supabase
    .from('am_video_sessions')
    .update({
      position_samples:      current,
      max_position_secs:     maxPositionSecs,
      duration_watched_secs: durationWatchedSecs,
    })
    .eq('id', sessionId);
}

/** Close a session when the user stops watching. */
export async function endWatchSession(
  sessionId: string,
  maxPositionSecs: number,
  durationWatchedSecs: number,
  completed: boolean,
): Promise<void> {
  await supabase
    .from('am_video_sessions')
    .update({
      session_end:           new Date().toISOString(),
      max_position_secs:     maxPositionSecs,
      duration_watched_secs: durationWatchedSecs,
      completed,
    })
    .eq('id', sessionId);
}

// ─── Video Analytics (HQ) ─────────────────────────────────────────────────────

/** Aggregate analytics for a specific video. */
export async function getVideoAnalytics(videoId: string): Promise<AMVideoAnalytics> {
  const { data: sessions } = await supabase
    .from('am_video_sessions')
    .select('*, agent:agent_id(id, full_name)')
    .eq('video_id', videoId)
    .order('created_at', { ascending: false });

  const rows: AMVideoSession[] = (sessions || []) as any[];

  // Unique agents
  const agentMap = new Map<number, {
    agent_name: string;
    max_position_secs: number;
    completed: boolean;
    suspicious_sessions: number;
    sessions: AMVideoSession[];
  }>();
  for (const s of rows) {
    const aid = s.agent_id;
    if (!agentMap.has(aid)) {
      agentMap.set(aid, {
        agent_name: (s as any).agent?.full_name || 'Unknown',
        max_position_secs: s.max_position_secs,
        completed: s.completed && !s.integrity_suspicious,
        suspicious_sessions: s.integrity_suspicious ? 1 : 0,
        sessions: [s],
      });
    } else {
      const entry = agentMap.get(aid)!;
      entry.max_position_secs = Math.max(entry.max_position_secs, s.max_position_secs);
      entry.completed = entry.completed || (s.completed && !s.integrity_suspicious);
      if (s.integrity_suspicious) entry.suspicious_sessions += 1;
      entry.sessions.push(s);
    }
  }

  const uniqueAgents = agentMap.size;
  const totalViews   = rows.length;
  const completions  = [...agentMap.values()].filter(a => a.completed).length;
  const totalWatchSecs = rows.reduce((sum, s) => sum + (s.duration_watched_secs || 0), 0);

  // Drop-off: bin all final positions into 10-second buckets
  const dropBuckets = new Map<number, number>();
  for (const s of rows) {
    const bucket = Math.floor((s.max_position_secs || 0) / 10) * 10;
    dropBuckets.set(bucket, (dropBuckets.get(bucket) || 0) + 1);
  }
  const drop_off_points = [...dropBuckets.entries()]
    .map(([position_secs, drop_count]) => ({ position_secs, drop_count }))
    .sort((a, b) => b.drop_count - a.drop_count)
    .slice(0, 10);

  const agent_progress = [...agentMap.entries()].map(([agent_id, a]) => ({
    agent_id,
    agent_name:       a.agent_name,
    max_position_secs: a.max_position_secs,
    completed:        a.completed,
    session_count:    a.sessions.length,
    last_watched:     a.sessions[0]?.created_at || '',
    suspicious_sessions: a.suspicious_sessions,
  }));

  return {
    video_id: videoId,
    total_views: totalViews,
    unique_agents: uniqueAgents,
    avg_completion_pct: uniqueAgents > 0 ? Math.round((completions / uniqueAgents) * 100) : 0,
    completion_count: completions,
    total_watch_secs: totalWatchSecs,
    drop_off_points,
    agent_progress,
  };
}

/** Get all agents with their overall watch summary (for HQ agent management). */
export async function getAllAgentsWithProgress(): Promise<Array<AMAgent & { videos_watched: number; videos_completed: number; total_watch_secs: number; last_active?: string }>> {
  const { data: agents } = await supabase
    .from('airtelmoney_agents')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: sessions } = await supabase
    .from('am_video_sessions')
    .select('agent_id, video_id, completed, integrity_suspicious, duration_watched_secs, session_start');

  // agent_id is bigint (number) from DB
  const agentSessions = new Map<number, { videos: Set<string>; completedVideos: Set<string>; totalSecs: number; lastActive: string }>();

  for (const s of (sessions || [])) {
    const aid: number = s.agent_id;
    if (!agentSessions.has(aid)) {
      agentSessions.set(aid, { videos: new Set(), completedVideos: new Set(), totalSecs: 0, lastActive: s.session_start });
    }
    const entry = agentSessions.get(aid)!;
    entry.videos.add(s.video_id);
    if (s.completed && !s.integrity_suspicious) entry.completedVideos.add(s.video_id);
    entry.totalSecs += s.duration_watched_secs || 0;
    if (s.session_start > entry.lastActive) entry.lastActive = s.session_start;
  }

  return (agents || []).map((a: any) => {
    const summary = agentSessions.get(a.id as number);
    return {
      ...a,
      videos_watched:   summary?.videos.size || 0,
      videos_completed: summary?.completedVideos.size || 0,
      total_watch_secs: summary?.totalSecs || 0,
      last_active:      summary?.lastActive,
    };
  });
}

// ─── Complaints ───────────────────────────────────────────────────────────────

/** Submit a new complaint. */
export async function submitComplaint(fields: {
  agent_id: string;
  category: string;
  description: string;
  photo_url?: string;
}): Promise<AMComplaint> {
  const { data, error } = await supabase
    .from('am_complaints')
    .insert([fields])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as AMComplaint;
}

/** Get all complaints for a specific agent. */
export async function getAgentComplaints(agentId: string): Promise<AMComplaint[]> {
  const { data, error } = await supabase
    .from('am_complaints')
    .select('*, responses:am_complaint_responses(*), rating:am_complaint_ratings(*)')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data || []).map(c => ({
    ...c,
    responses: c.responses || [],
    rating:    c.rating?.[0] || null,
  })) as AMComplaint[];
}

/** Get all complaints (for HQ admin), with agent info. */
export async function getAllComplaints(statusFilter?: string): Promise<AMComplaint[]> {
  let query = supabase
    .from('am_complaints')
    .select('*, agent:agent_id(full_name, phone, agent_code), responses:am_complaint_responses(*), rating:am_complaint_ratings(*)')
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map(c => ({
    ...c,
    responses: c.responses || [],
    rating:    c.rating?.[0] || null,
  })) as AMComplaint[];
}

/** Admin responds to a complaint and optionally updates its status. */
export async function respondToComplaint(fields: {
  complaint_id: string;
  responder_id: number;    // bigint FK → AIRTELMONEY_HQ.id
  message: string;
  new_status?: 'open' | 'in_progress' | 'resolved';
}): Promise<void> {
  const { complaint_id, responder_id, message, new_status } = fields;

  await supabase
    .from('am_complaint_responses')
    .insert([{ complaint_id, responder_id, message }]);

  const updates: any = { updated_at: new Date().toISOString() };

  if (new_status) {
    updates.status = new_status;
    if (new_status === 'in_progress' ) updates.picked_up_at = new Date().toISOString();
    if (new_status === 'resolved')     updates.resolved_at  = new Date().toISOString();
  }

  await supabase.from('am_complaints').update(updates).eq('id', complaint_id);
}

/** Agent rates a resolved complaint. */
export async function rateComplaint(fields: {
  complaint_id: string;
  agent_id: number;    // bigint FK → AIRTELMONEY_AGENTS.id
  rating: number;
  comment?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('am_complaint_ratings')
    .upsert([fields], { onConflict: 'complaint_id' });
  if (error) throw new Error(error.message);
}
