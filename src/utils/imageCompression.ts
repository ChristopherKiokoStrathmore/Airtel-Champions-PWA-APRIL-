/**
 * Image Compression Utility for TAI App
 * Optimizes images for 2G/3G networks before upload
 */

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress an image file for faster uploads on slow networks
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed file with metadata
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxSizeMB = 0.5,  // 500KB max - good for 2G/3G
    maxWidthOrHeight = 1024,  // Max dimension
    quality = 0.8  // 80% quality
  } = options;

  const originalSize = file.size;

  try {
    // Create canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Load image
    const img = await createImageBitmap(file);
    
    // Calculate new dimensions maintaining aspect ratio
    let { width, height } = img;
    if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
      if (width > height) {
        height = (height / width) * maxWidthOrHeight;
        width = maxWidthOrHeight;
      } else {
        width = (width / height) * maxWidthOrHeight;
        height = maxWidthOrHeight;
      }
    }

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Draw image on canvas
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob with compression
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type.startsWith('image/png') ? 'image/png' : 'image/jpeg',
        quality
      );
    });

    // Check if we need to compress further
    let finalBlob = blob;
    let currentQuality = quality;
    
    // If still too large, reduce quality further
    while (finalBlob.size > maxSizeMB * 1024 * 1024 && currentQuality > 0.3) {
      currentQuality -= 0.1;
      finalBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type.startsWith('image/png') ? 'image/png' : 'image/jpeg',
          currentQuality
        );
      });
    }

    // Create new File from blob
    const compressedFile = new File(
      [finalBlob],
      file.name,
      { type: finalBlob.type }
    );

    const compressedSize = compressedFile.size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    console.log(`[ImageCompression] Original: ${(originalSize / 1024).toFixed(2)}KB → Compressed: ${(compressedSize / 1024).toFixed(2)}KB (${compressionRatio.toFixed(1)}% reduction)`);

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio
    };
  } catch (error) {
    console.error('[ImageCompression] Error:', error);
    // Return original file if compression fails
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0
    };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
