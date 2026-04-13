// ============================================================================
// OFFLINE SYNC MODULE
// Sales Intelligence Network - Airtel Kenya
// ============================================================================
// Handles: Offline queue, sync conflicts, partial uploads, sync status
// ============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { validateOrThrow } from "./validation.tsx";
import { SyncSubmissionsSchema } from "./validation.tsx";
import { sanitizeText } from "./security.tsx";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ============================================================================
// TYPES
// ============================================================================

export interface OfflineSubmission {
  clientId: string;
  data: {
    missionTypeId: string;
    photoUrl?: string;
    location: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
    locationName: string;
    notes?: string;
    photoMetadata?: any;
  };
  photoBase64?: string;
  createdAtDevice: string;
}

export interface SyncResult {
  clientId: string;
  status: 'synced' | 'failed' | 'conflict' | 'already_synced';
  serverId?: string;
  error?: string;
  conflictData?: any;
}

export interface ConflictResolution {
  strategy: 'use_server' | 'use_client' | 'merge';
  clientId: string;
  serverData?: any;
  clientData?: any;
}

// ============================================================================
// SYNC SUBMISSIONS (MAIN ENDPOINT)
// ============================================================================

/**
 * Sync multiple offline submissions to server
 * POST /v1/sync/submissions
 */
export async function syncSubmissions(
  userId: string,
  submissions: OfflineSubmission[]
): Promise<{
  success: boolean;
  data?: {
    synced: number;
    failed: number;
    conflicts: number;
    alreadySynced: number;
    results: SyncResult[];
  };
  error?: string;
}> {
  console.log(`🔄 Syncing ${submissions.length} submissions for user ${userId}`);
  
  const results: SyncResult[] = [];
  let synced = 0;
  let failed = 0;
  let conflicts = 0;
  let alreadySynced = 0;
  
  for (const submission of submissions) {
    try {
      const result = await syncSingleSubmission(userId, submission);
      results.push(result);
      
      switch (result.status) {
        case 'synced':
          synced++;
          break;
        case 'failed':
          failed++;
          break;
        case 'conflict':
          conflicts++;
          break;
        case 'already_synced':
          alreadySynced++;
          break;
      }
    } catch (error: any) {
      console.error(`❌ Sync error for clientId ${submission.clientId}:`, error);
      results.push({
        clientId: submission.clientId,
        status: 'failed',
        error: error.message
      });
      failed++;
    }
  }
  
  console.log(`✅ Sync complete: ${synced} synced, ${failed} failed, ${conflicts} conflicts, ${alreadySynced} already synced`);
  
  return {
    success: true,
    data: {
      synced,
      failed,
      conflicts,
      alreadySynced,
      results
    }
  };
}

/**
 * Sync a single submission
 */
async function syncSingleSubmission(
  userId: string,
  submission: OfflineSubmission
): Promise<SyncResult> {
  const { clientId, data, photoBase64, createdAtDevice } = submission;
  
  // Step 1: Check if already synced
  const existing = await checkExistingSubmission(clientId);
  if (existing) {
    return {
      clientId,
      status: 'already_synced',
      serverId: existing.id
    };
  }
  
  // Step 2: Check for conflicts (same user, same location, within 1 hour)
  const conflict = await checkConflict(userId, data, createdAtDevice);
  if (conflict) {
    // Store conflict for resolution
    await storeConflict(userId, clientId, data, conflict);
    
    return {
      clientId,
      status: 'conflict',
      conflictData: {
        serverId: conflict.id,
        serverData: conflict,
        clientData: data
      }
    };
  }
  
  // Step 3: Upload photo if provided
  let photoUrl = data.photoUrl;
  if (photoBase64) {
    try {
      photoUrl = await uploadPhotoFromBase64(userId, photoBase64, clientId);
    } catch (error: any) {
      console.error('Photo upload failed:', error);
      // Continue without photo - can retry later
    }
  }
  
  // Step 4: Create submission
  try {
    const { data: created, error } = await supabase
      .from('submissions')
      .insert({
        se_id: userId,  // ✅ FIXED: Changed from user_id to se_id
        mission_type_id: data.missionTypeId,
        photo_url: photoUrl,
        location: `POINT(${data.location.longitude} ${data.location.latitude})`,
        location_name: data.locationName || 'Unknown',
        notes: data.notes,
        client_id: data.clientId,
        created_at_device: data.createdAt,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Log successful sync
    await logSync(userId, 'SYNC_SUBMISSION', 'submission', created.id, clientId, 'success');
    
    return {
      clientId,
      status: 'synced',
      serverId: created.id
    };
    
  } catch (error: any) {
    // Log failed sync
    await logSync(userId, 'SYNC_SUBMISSION', 'submission', null, clientId, 'failed', error.message);
    
    throw error;
  }
}

// ============================================================================
// CONFLICT DETECTION & RESOLUTION
// ============================================================================

/**
 * Check if submission already exists by clientId
 */
async function checkExistingSubmission(clientId: string): Promise<any> {
  const { data } = await supabase
    .from('submissions')
    .select('id, status, points_awarded, reviewed_at')
    .eq('client_id', clientId)
    .single();
  
  return data;
}

/**
 * Check for potential conflicts
 * Conflict = same user, similar location (within 100m), within 1 hour
 */
async function checkConflict(
  userId: string,
  submissionData: any,
  createdAtDevice: string
): Promise<any> {
  const deviceTime = new Date(createdAtDevice);
  const oneHourBefore = new Date(deviceTime.getTime() - 60 * 60 * 1000);
  const oneHourAfter = new Date(deviceTime.getTime() + 60 * 60 * 1000);
  
  // Query for similar submissions
  const { data: similarSubmissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('se_id', userId)  // ✅ FIXED: Changed from user_id to se_id
    .eq('mission_type_id', submissionData.missionTypeId)
    .gte('created_at', oneHourBefore.toISOString())
    .lte('created_at', oneHourAfter.toISOString())
    .limit(10);
  
  if (!similarSubmissions || similarSubmissions.length === 0) {
    return null;
  }
  
  // Check location proximity (within 100m)
  for (const existing of similarSubmissions) {
    const distance = calculateDistance(
      submissionData.location.latitude,
      submissionData.location.longitude,
      existing.location.coordinates[1], // lat
      existing.location.coordinates[0]  // lng
    );
    
    if (distance < 0.1) { // Less than 100 meters
      return existing;
    }
  }
  
  return null;
}

/**
 * Calculate distance between two points (km)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Store conflict for manual resolution
 */
async function storeConflict(
  userId: string,
  clientId: string,
  clientData: any,
  serverData: any
): Promise<void> {
  await supabase.from('sync_conflicts').insert({
    user_id: userId,
    client_id: clientId,
    client_data: clientData,
    server_submission_id: serverData.id,
    server_data: serverData,
    status: 'pending',
    created_at: new Date().toISOString()
  });
}

/**
 * Resolve conflict
 * POST /v1/sync/resolve-conflict
 */
export async function resolveConflict(
  userId: string,
  clientId: string,
  strategy: 'use_server' | 'use_client' | 'merge'
): Promise<{ success: boolean; data?: any; error?: string }> {
  // Get conflict
  const { data: conflict } = await supabase
    .from('sync_conflicts')
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .eq('status', 'pending')
    .single();
  
  if (!conflict) {
    return {
      success: false,
      error: 'Conflict not found'
    };
  }
  
  let result;
  
  switch (strategy) {
    case 'use_server':
      // Keep server version, mark conflict as resolved
      result = conflict.server_data;
      break;
      
    case 'use_client':
      // Update server with client data
      const { data: updated } = await supabase
        .from('submissions')
        .update({
          location_name: conflict.client_data.locationName,
          notes: conflict.client_data.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', conflict.server_submission_id)
        .select()
        .single();
      
      result = updated;
      break;
      
    case 'merge':
      // Merge both versions (prefer client for notes, server for status)
      const { data: merged } = await supabase
        .from('submissions')
        .update({
          notes: conflict.client_data.notes || conflict.server_data.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', conflict.server_submission_id)
        .select()
        .single();
      
      result = merged;
      break;
  }
  
  // Mark conflict as resolved
  await supabase
    .from('sync_conflicts')
    .update({
      status: 'resolved',
      resolution_strategy: strategy,
      resolved_at: new Date().toISOString()
    })
    .eq('id', conflict.id);
  
  return {
    success: true,
    data: result
  };
}

// ============================================================================
// SYNC STATUS
// ============================================================================

/**
 * Get sync status and updates since last sync
 * GET /v1/sync/status
 */
export async function getSyncStatus(
  userId: string,
  since?: string
): Promise<{
  success: boolean;
  data?: {
    updates: any[];
    conflicts: any[];
    serverTime: string;
    lastSyncTime: string | null;
  };
  error?: string;
}> {
  const sinceDate = since ? new Date(since) : new Date(0);
  
  // Get updates to user's submissions since last sync
  const { data: updates } = await supabase
    .from('submissions')
    .select('id, client_id, status, points_awarded, reviewed_at, review_notes, updated_at')
    .eq('se_id', userId)  // ✅ FIXED: Changed from user_id to se_id
    .gte('updated_at', sinceDate.toISOString())
    .order('updated_at', { ascending: false });
  
  // Get pending conflicts
  const { data: conflicts } = await supabase
    .from('sync_conflicts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending');
  
  // Get last sync time
  const { data: lastSync } = await supabase
    .from('sync_log')
    .select('created_at')
    .eq('user_id', userId)
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return {
    success: true,
    data: {
      updates: updates || [],
      conflicts: conflicts || [],
      serverTime: new Date().toISOString(),
      lastSyncTime: lastSync?.created_at || null
    }
  };
}

// ============================================================================
// PHOTO UPLOAD FROM BASE64
// ============================================================================

/**
 * Upload photo from Base64 string
 */
async function uploadPhotoFromBase64(
  userId: string,
  photoBase64: string,
  clientId: string
): Promise<string> {
  // Remove data URI prefix if present
  const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
  
  // Decode Base64
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Generate filename
  const timestamp = Date.now();
  const fileName = `${userId}/${timestamp}-${clientId}.jpg`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('submissions-photos')
    .upload(fileName, bytes, {
      contentType: 'image/jpeg',
      upsert: false
    });
  
  if (error) {
    throw new Error(`Photo upload failed: ${error.message}`);
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('submissions-photos')
    .getPublicUrl(fileName);
  
  return publicUrl;
}

// ============================================================================
// RESUMABLE UPLOADS
// ============================================================================

/**
 * Create signed URL for resumable upload
 * POST /v1/sync/upload-url
 */
export async function createResumableUploadURL(
  userId: string,
  fileName: string
): Promise<{
  success: boolean;
  data?: {
    uploadUrl: string;
    expiresAt: number;
    fileName: string;
  };
  error?: string;
}> {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fullPath = `${userId}/${timestamp}-${sanitizedFileName}`;
  
  try {
    // Create signed upload URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from('submissions-photos')
      .createSignedUploadUrl(fullPath);
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      data: {
        uploadUrl: data.signedUrl,
        expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
        fileName: fullPath
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Complete resumable upload
 * POST /v1/sync/upload-complete
 */
export async function completeResumableUpload(
  userId: string,
  fileName: string
): Promise<{
  success: boolean;
  data?: {
    publicUrl: string;
  };
  error?: string;
}> {
  try {
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('submissions-photos')
      .getPublicUrl(fileName);
    
    return {
      success: true,
      data: {
        publicUrl
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// SYNC LOGGING
// ============================================================================

/**
 * Log sync operation
 */
async function logSync(
  userId: string,
  operation: string,
  entityType: string,
  entityId: string | null,
  clientId: string,
  status: string,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('sync_log').insert({
      user_id: userId,
      operation,
      entity_type: entityType,
      entity_id: entityId,
      client_id: clientId,
      status,
      error_message: errorMessage,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log sync:', error);
  }
}

/**
 * Get sync history
 * GET /v1/sync/history
 */
export async function getSyncHistory(
  userId: string,
  limit: number = 50
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  const { data, error } = await supabase
    .from('sync_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    return {
      success: false,
      error: error.message
    };
  }
  
  return {
    success: true,
    data: data || []
  };
}

// ============================================================================
// RETRY FAILED SYNCS
// ============================================================================

/**
 * Retry failed sync operations
 * POST /v1/sync/retry
 */
export async function retryFailedSyncs(
  userId: string,
  clientIds?: string[]
): Promise<{
  success: boolean;
  data?: {
    retried: number;
    succeeded: number;
    failed: number;
  };
  error?: string;
}> {
  // Get failed syncs
  let query = supabase
    .from('sync_log')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (clientIds && clientIds.length > 0) {
    query = query.in('client_id', clientIds);
  }
  
  const { data: failedSyncs } = await query;
  
  if (!failedSyncs || failedSyncs.length === 0) {
    return {
      success: true,
      data: {
        retried: 0,
        succeeded: 0,
        failed: 0
      }
    };
  }
  
  // TODO: Implement retry logic
  // For now, return placeholder
  return {
    success: true,
    data: {
      retried: failedSyncs.length,
      succeeded: 0,
      failed: 0
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const offlineSync = {
  syncSubmissions,
  getSyncStatus,
  resolveConflict,
  createResumableUploadURL,
  completeResumableUpload,
  getSyncHistory,
  retryFailedSyncs,
};