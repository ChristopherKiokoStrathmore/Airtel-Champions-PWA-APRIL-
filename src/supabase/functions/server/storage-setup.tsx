import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const BUCKET_NAMES = {
  programPhotos: 'make-28f2f653-program-photos',
  profilePhotos: 'make-28f2f653-profile-photos',
  postImages: 'make-28f2f653-post-images',
};

/**
 * Initialize Supabase Storage buckets for TAI app
 * This function is idempotent - safe to call multiple times
 */
export async function initializeStorageBucket() {
  const results: any[] = [];
  
  // Create all buckets
  for (const [key, bucketName] of Object.entries(BUCKET_NAMES)) {
    const result = await createBucketIfNotExists(bucketName);
    results.push({ bucket: bucketName, ...result });
  }
  
  return {
    success: results.every(r => r.success),
    results
  };
}

/**
 * Create a single bucket if it doesn't exist
 * Handles transient 502/503 errors with retry
 */
async function createBucketIfNotExists(bucketName: string, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Storage] Retry attempt ${attempt} for bucket: ${bucketName}`);
        await new Promise(r => setTimeout(r, 1000 * attempt)); // backoff
      }
      console.log('[Storage] Checking if bucket exists:', bucketName);
      
      // Check if bucket already exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        const status = (listError as any).status || (listError as any).statusCode;
        // Retry on transient server errors (502, 503, 504)
        if ((status === 502 || status === 503 || status === 504) && attempt < retries) {
          console.warn(`[Storage] Transient error (${status}) listing buckets, will retry...`);
          continue;
        }
        console.error('[Storage] Error listing buckets:', listError);
        return { success: false, error: listError.message };
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (bucketExists) {
        console.log('[Storage] ✅ Bucket already exists:', bucketName);
        return { success: true, message: 'Bucket already exists', bucket: bucketName };
      }
      
      // Create the bucket as PRIVATE (with RLS policies)
      console.log('[Storage] Creating new PRIVATE bucket:', bucketName);
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(
        bucketName,
        {
          public: false,
          fileSizeLimit: 10485760,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
        }
      );
      
      if (createError) {
        // If bucket was created by another concurrent request, treat as success
        if (createError.message?.includes('already exists')) {
          console.log('[Storage] ✅ Bucket already exists (race condition):', bucketName);
          return { success: true, message: 'Bucket already exists', bucket: bucketName };
        }
        console.error('[Storage] Error creating bucket:', createError);
        return { success: false, error: createError.message };
      }
      
      console.log('[Storage] ✅ Bucket created successfully:', bucketName);
      
      return { 
        success: true, 
        message: 'Bucket created successfully',
        bucket: bucketName 
      };
      
    } catch (error: any) {
      if (attempt < retries) {
        console.warn(`[Storage] Transient error for ${bucketName}, will retry:`, error.message);
        continue;
      }
      console.error('[Storage] Fatal error during bucket initialization:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error during storage initialization' 
      };
    }
  }
  // Should not reach here, but just in case
  return { success: false, error: 'Max retries exhausted' };
}

/**
 * Set up Row Level Security policies for the storage bucket
 * 
 * Since TAI uses localStorage auth (not Supabase Auth), all storage operations
 * go through the backend server using SERVICE_ROLE. The RLS policy simply
 * ensures that ONLY the service role can access the bucket.
 * 
 * Authorization is handled in the backend:
 * - Server checks user data from localStorage before operations
 * - Server generates signed URLs only for authorized users
 */
async function setupRLSPolicies() {
  try {
    console.log('[Storage] Setting up RLS policies...');
    
    // Note: Supabase Storage RLS policies are managed via SQL in the Supabase dashboard
    // We'll create the SQL commands that need to be run
    
    const rlsPolicies = `
-- ============================================================
-- STORAGE RLS POLICIES FOR: ${BUCKET_NAME}
-- ============================================================

-- DROP existing policies if they exist (for re-running this script)
DROP POLICY IF EXISTS "Service role has full access" ON storage.objects;

-- POLICY: Allow service role (backend server) full access to the bucket
-- All uploads, downloads, and deletions are handled by the backend
CREATE POLICY "Service role has full access"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = '${BUCKET_NAME}')
WITH CHECK (bucket_id = '${BUCKET_NAME}');

-- ============================================================
-- EXPLANATION
-- ============================================================
-- TAI uses localStorage-based authentication, NOT Supabase Auth.
-- All storage operations are proxied through the backend server:
-- - Photo uploads: Frontend → Server (SERVICE_ROLE) → Storage
-- - Photo viewing: Frontend → Server generates signed URL → Storage
-- - Authorization: Server checks user permissions before operations
-- ============================================================
`;

    console.log('[Storage] ⚠️  RLS Policies need to be applied manually:');
    console.log('[Storage] Go to: https://supabase.com/dashboard/project/' + Deno.env.get('SUPABASE_URL')?.split('//')[1]?.split('.')[0] + '/sql/new');
    console.log('[Storage] Copy the SQL from: /database/STORAGE-RLS-POLICIES.sql');
    
    console.log('[Storage] ✅ RLS policy instructions ready');
    
    return { success: true };
    
  } catch (error: any) {
    console.error('[Storage] Error setting up RLS policies:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload a photo to Supabase Storage using SERVICE ROLE
 * This bypasses RLS and uploads on behalf of the user
 */
export async function uploadPhoto(
  file: File,
  userId: string,
  programId: string,
  bucketType: keyof typeof BUCKET_NAMES = 'programPhotos'
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> {
  try {
    // Ensure buckets exist
    await initializeStorageBucket();
    
    const bucketName = BUCKET_NAMES[bucketType];
    const fileName = `${programId}/${userId}/${Date.now()}_${file.name}`;
    
    console.log('[Storage] Uploading photo to:', bucketName, fileName);
    
    // Upload using service role (bypasses RLS)
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('[Storage] Upload error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[Storage] ✅ Photo uploaded successfully:', fileName);
    
    // For private buckets, we'll return the path instead of public URL
    // The frontend will need to create signed URLs when viewing
    return { 
      success: true, 
      path: fileName,
      url: `storage/${bucketName}/${fileName}` // Relative path
    };
    
  } catch (error: any) {
    console.error('[Storage] Fatal error during upload:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a signed URL for accessing a private photo
 * Signed URLs expire after a set time (default: 1 hour)
 */
export async function getSignedUrl(
  path: string,
  bucketType: keyof typeof BUCKET_NAMES = 'programPhotos',
  expiresIn: number = 3600
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  try {
    const bucketName = BUCKET_NAMES[bucketType];
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, expiresIn);
    
    if (error) {
      console.error('[Storage] Error creating signed URL:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, signedUrl: data.signedUrl };
    
  } catch (error: any) {
    console.error('[Storage] Fatal error creating signed URL:', error);
    return { success: false, error: error.message };
  }
}

// Export bucket names for use in other modules
export { BUCKET_NAMES };