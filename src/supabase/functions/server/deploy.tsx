import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

/**
 * 🚀 DEPLOYMENT ENDPOINT
 * 
 * This endpoint receives your React build files and deploys them to Supabase Storage
 * for hosting as a static website.
 * 
 * POST /make-server-28f2f653/deploy
 * 
 * Body: { files: { path: string, content: string (base64) }[] }
 * 
 * Returns: { success: true, url: string }
 */

const BUCKET_NAME = 'airtel-champions-app';

// MIME types for common file extensions
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.map': 'application/json',
};

function getMimeType(filepath: string): string {
  const ext = filepath.substring(filepath.lastIndexOf('.'));
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * POST /deploy
 * Deploy the React app to Supabase Storage
 */
app.post('/', async (c) => {
  try {
    console.log('[Deploy] �� Deployment request received');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Ensure bucket exists
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    if (listErr) {
      console.warn('[Deploy] ⚠️ Could not list buckets (may be transient):', listErr.message);
    }
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log('[Deploy] 🪣 Creating bucket:', BUCKET_NAME);
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 52428800, // 50 MB
        allowedMimeTypes: Object.values(MIME_TYPES),
      });

      if (error) {
        console.error('[Deploy] ❌ Error creating bucket:', error);
        return c.json({ error: `Failed to create bucket: ${error.message}` }, 500);
      }

      console.log('[Deploy] ✅ Bucket created');
    } else {
      console.log('[Deploy] ✅ Bucket exists');
    }

    // Step 2: Get files from request
    const body = await c.req.json();
    const files = body.files as Array<{ path: string; content: string }>;

    if (!files || !Array.isArray(files)) {
      return c.json({ error: 'Invalid request: files array required' }, 400);
    }

    console.log(`[Deploy] �� Uploading ${files.length} files...`);

    // Step 3: Upload each file
    const results = [];
    for (const file of files) {
      const { path, content } = file;
      
      try {
        // Decode base64 content
        const buffer = Uint8Array.from(atob(content), c => c.charCodeAt(0));
        const contentType = getMimeType(path);

        console.log(`[Deploy] 📤 Uploading: ${path} (${contentType})`);

        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(path, buffer, {
            contentType,
            upsert: true, // Overwrite if exists
            cacheControl: '3600', // 1 hour cache
          });

        if (error) {
          console.error(`[Deploy] ❌ Error uploading ${path}:`, error);
          results.push({ path, success: false, error: error.message });
        } else {
          console.log(`[Deploy] ✅ Uploaded: ${path}`);
          results.push({ path, success: true });
        }
      } catch (err: any) {
        console.error(`[Deploy] ❌ Exception uploading ${path}:`, err);
        results.push({ path, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[Deploy] ✅ Upload complete: ${successCount}/${files.length} files`);

    // Step 4: Return the app URL
    const appUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/${BUCKET_NAME}/index.html`;

    return c.json({
      success: true,
      uploaded: successCount,
      total: files.length,
      url: appUrl,
      results,
    });

  } catch (err: any) {
    console.error('[Deploy] ❌ Deployment error:', err);
    return c.json({ error: err.message }, 500);
  }
});

/**
 * GET /deploy/status
 * Check deployment status and get app URL
 */
app.get('/status', async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      return c.json({
        deployed: false,
        message: 'App not deployed yet',
      });
    }

    // Check if index.html exists
    const { data: files } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 100 });

    const hasIndexHtml = files?.some(f => f.name === 'index.html');

    const appUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/${BUCKET_NAME}/index.html`;

    return c.json({
      deployed: hasIndexHtml,
      url: hasIndexHtml ? appUrl : null,
      fileCount: files?.length || 0,
      bucket: BUCKET_NAME,
    });

  } catch (err: any) {
    console.error('[Deploy Status] ❌ Error:', err);
    return c.json({ error: err.message }, 500);
  }
});

/**
 * DELETE /deploy
 * Clear all deployed files (for redeployment)
 */
app.delete('/', async (c) => {
  try {
    console.log('[Deploy] 🗑️ Clearing deployment...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // List all files in bucket
    const { data: files } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000 });

    if (!files || files.length === 0) {
      return c.json({ message: 'No files to delete' });
    }

    // Delete all files
    const filePaths = files.map(f => f.name);
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (error) {
      console.error('[Deploy] ❌ Error deleting files:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log(`[Deploy] ✅ Deleted ${filePaths.length} files`);

    return c.json({
      success: true,
      deleted: filePaths.length,
    });

  } catch (err: any) {
    console.error('[Deploy] ❌ Delete error:', err);
    return c.json({ error: err.message }, 500);
  }
});

export default app;