// Alternative KV store using Supabase Storage instead of database
// This bypasses the kv_store_28f2f653 permission issues

import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const BUCKET_NAME = 'make-28f2f653-program-photos';
const KV_FOLDER = '_kv_data'; // Store KV data in a special folder

const getClient = () => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return createClient(url, key);
};

// Set stores a key-value pair in Storage as a JSON file
export const set = async (key: string, value: any): Promise<void> => {
  try {
    const supabase = getClient();
    const filePath = `${KV_FOLDER}/${key}.json`;
    
    // Convert value to JSON string if it's not already
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    const blob = new Blob([jsonValue], { type: 'application/json' });
    
    // Upload to storage (overwrites if exists)
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, { 
        upsert: true,
        contentType: 'application/json'
      });
    
    if (error) {
      throw new Error(`Storage set error: ${error.message}`);
    }
    
    console.log('[StorageKV] Set:', key);
  } catch (error: any) {
    console.error('[StorageKV] Set error:', error);
    throw error;
  }
};

// Get retrieves a key-value pair from Storage
export const get = async (key: string): Promise<any> => {
  try {
    const supabase = getClient();
    const filePath = `${KV_FOLDER}/${key}.json`;
    
    // Download from storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);
    
    if (error) {
      // If file doesn't exist, return null (not an error)
      if (error.message?.includes('not found') || error.message?.includes('Object not found')) {
        return { value: null };
      }
      throw new Error(`Storage get error: ${error.message}`);
    }
    
    if (!data) {
      return { value: null };
    }
    
    // Parse JSON
    const text = await data.text();
    const value = JSON.parse(text);
    
    console.log('[StorageKV] Get:', key, 'found');
    return { value };
  } catch (error: any) {
    console.error('[StorageKV] Get error:', error);
    throw error;
  }
};

// Delete deletes a key-value pair from Storage
export const del = async (key: string): Promise<void> => {
  try {
    const supabase = getClient();
    const filePath = `${KV_FOLDER}/${key}.json`;
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);
    
    if (error) {
      throw new Error(`Storage delete error: ${error.message}`);
    }
    
    console.log('[StorageKV] Deleted:', key);
  } catch (error: any) {
    console.error('[StorageKV] Delete error:', error);
    throw error;
  }
};

// Get all keys with a prefix (list files in folder)
export const getByPrefix = async (prefix: string): Promise<any[]> => {
  try {
    const supabase = getClient();
    
    // List all files in the KV folder
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(KV_FOLDER, {
        limit: 1000,
        offset: 0,
      });
    
    if (listError) {
      throw new Error(`Storage list error: ${listError.message}`);
    }
    
    if (!files || files.length === 0) {
      return [];
    }
    
    // Filter files by prefix
    const matchingFiles = files.filter(file => {
      const key = file.name.replace('.json', '');
      return key.startsWith(prefix);
    });
    
    console.log('[StorageKV] GetByPrefix:', prefix, 'found', matchingFiles.length);
    
    // Download and parse each file
    const results = await Promise.all(
      matchingFiles.map(async (file) => {
        const key = file.name.replace('.json', '');
        const filePath = `${KV_FOLDER}/${file.name}`;
        
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .download(filePath);
        
        if (error || !data) {
          console.error('[StorageKV] Error downloading:', filePath, error);
          return null;
        }
        
        const text = await data.text();
        const value = JSON.parse(text);
        
        return { key, value };
      })
    );
    
    // Filter out nulls
    return results.filter(r => r !== null);
  } catch (error: any) {
    console.error('[StorageKV] GetByPrefix error:', error);
    throw error;
  }
};

// Sets multiple key-value pairs
export const mset = async (keys: string[], values: any[]): Promise<void> => {
  await Promise.all(keys.map((key, i) => set(key, values[i])));
};

// Gets multiple key-value pairs
export const mget = async (keys: string[]): Promise<any[]> => {
  const results = await Promise.all(keys.map(key => get(key)));
  return results.map(r => r.value);
};

// Deletes multiple key-value pairs
export const mdel = async (keys: string[]): Promise<void> => {
  await Promise.all(keys.map(key => del(key)));
};
