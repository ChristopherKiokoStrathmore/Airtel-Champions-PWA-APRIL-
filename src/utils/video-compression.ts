/**
 * Fast Chunked Video Upload Utility
 * Uses Supabase multipart upload for optimal speed
 * No compression - files uploaded as-is for maximum speed
 */

export interface UploadProgress {
  stage: 'preparing' | 'uploading';
  percent: number;
  message: string;
  speed?: string; // MB/s
}

export interface ChunkedUploadOptions {
  chunkSize?: number; // bytes (default: 5MB for optimal speed)
  parallelChunks?: number; // simultaneous chunks (default: 3)
  onProgress?: (progress: UploadProgress) => void;
}

/**
 * Format bytes to human-readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Dummy compression function for backward compatibility
 * Actual optimization happens in chunked upload
 */
export async function compressVideo(
  file: File,
  options: any = {}
): Promise<Blob> {
  // No compression - return original file
  // Speed optimization done in uploadVideoFile with chunked uploads
  options.onProgress?.({
    stage: 'preparing',
    percent: 100,
    message: `Ready to upload: ${formatFileSize(file.size)}`
  });
  return file;
}

/**
 * Calculate upload speed
 */
export function calculateSpeed(bytes: number, elapsedMs: number): string {
  if (elapsedMs === 0) return '0 MB/s';
  const speedMbps = (bytes / (1024 * 1024)) / (elapsedMs / 1000);
  if (speedMbps > 100) return '>100 MB/s';
  return speedMbps.toFixed(1) + ' MB/s';
}

/**
 * Calculate time remaining
 */
export function calculateETA(remainingBytes: number, speedBytesPerSec: number): string {
  if (speedBytesPerSec === 0) return 'calculating...';
  const secondsRemaining = remainingBytes / speedBytesPerSec;
  
  if (secondsRemaining < 60) {
    return Math.round(secondsRemaining) + 's';
  }
  const minutes = Math.round(secondsRemaining / 60);
  return minutes + 'm';
}
