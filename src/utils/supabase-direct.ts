// Direct Supabase client for TAI app
// Bypasses Edge Functions completely - simpler and faster!

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabase as sharedSupabase } from './supabase/client';
import { projectId, publicAnonKey } from './supabase/info';

// Re-export the shared supabase client to avoid multiple instances
export const supabase = sharedSupabase;

console.log('[Supabase Direct] Using shared client:', {
  url: SUPABASE_URL,
  keyPrefix: SUPABASE_ANON_KEY.substring(0, 20) + '...',
});

// KV Store - Direct database access
const KV_TABLE = 'kv_store_28f2f653';

export const kvStore = {
  // Get a single value
  async get(key: string) {
    try {
      const { data, error } = await supabase
        .from(KV_TABLE)
        .select('value')
        .eq('key', key)
        .maybeSingle();
      
      if (error) {
        // Enhanced error message for permission issues
        if (error.code === '42501') {
          console.error('❌ PERMISSION DENIED ERROR');
          console.error('📋 FIX: Run /database/ONE-CLICK-FIX.sql in Supabase SQL Editor');
          console.error('📖 Details: See /database/QUICK-START.md');
        }
        throw error;
      }
      return data?.value || null;
    } catch (error: any) {
      console.error('[KVStore] Get error:', error);
      throw error;
    }
  },

  // Set a value (upsert)
  async set(key: string, value: any) {
    try {
      const { error } = await supabase
        .from(KV_TABLE)
        .upsert({ key, value });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('[KVStore] Set error:', error);
      throw error;
    }
  },

  // Get all keys with prefix
  async getByPrefix(prefix: string) {
    try {
      const { data, error } = await supabase
        .from(KV_TABLE)
        .select('key, value')
        .like('key', `${prefix}%`);
      
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[KVStore] GetByPrefix error:', error);
      throw error;
    }
  },

  // Delete a key
  async delete(key: string) {
    try {
      const { error } = await supabase
        .from(KV_TABLE)
        .delete()
        .eq('key', key);
      
      if (error) throw error;
    } catch (error: any) {
      console.error('[KVStore] Delete error:', error);
      throw error;
    }
  },
};

// Programs API - Direct access
const PROGRAMS_PREFIX = 'programs:';
const PROGRAM_FIELDS_PREFIX = 'program_fields:';
const SUBMISSIONS_PREFIX = 'submissions:';

import { localCache, CACHE_TTL } from '../lib/local-cache';

export const programsAPI = {
  // Get all programs
  async getPrograms(userRole: string = 'sales_executive') {
    try {
      console.log('[ProgramsAPI] Fetching programs for role:', userRole);
      
      const cacheKey = `programs_list_${userRole}`;
      
      const programs = await localCache.fetchWithCache(
        cacheKey,
        async () => {
          const { data: programs, error } = await supabase
            .from('programs')
            .select('*')
            .eq('status', 'active');
          
          if (error) {
            console.error('[ProgramsAPI] Error fetching programs:', error);
            throw error;
          }
          
          return programs || [];
        },
        CACHE_TTL.PROGRAMS_LIST
      );
      
      // Filter programs for this role (done client-side so cache is shared)
      const filteredPrograms = programs.filter((p: any) => 
        p.target_roles?.includes(userRole)
      );
      
      // Merge session checkin flags from make-server KV store
      try {
        const flagsRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/checkin/flags`,
          { headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' } }
        );
        if (flagsRes.ok) {
          const flagsData = await flagsRes.json();
          const flags = flagsData.flags || {};
          filteredPrograms.forEach((prog: any) => {
            if (flags[prog.id]) {
              prog.session_checkin_enabled = true;
            }
          });
          console.log('[ProgramsAPI] ✅ Merged checkin flags into SE programs');
        }
      } catch (flagErr) {
        console.error('[ProgramsAPI] ⚠️ Could not load checkin flags:', flagErr);
      }
      
      console.log('[ProgramsAPI] Found', filteredPrograms.length, 'programs for role', userRole);
      return filteredPrograms;
    } catch (error: any) {
      console.error('[ProgramsAPI] Error fetching programs:', error);
      throw error;
    }
  },

  // Get single program with fields
  async getProgram(programId: string) {
    try {
      console.log('[ProgramsAPI] Fetching program:', programId);
      
      const cacheKey = `program_detail_${programId}`;
      
      const result = await localCache.fetchWithCache(
        cacheKey,
        async () => {
          const { data: program, error: programError } = await supabase
            .from('programs')
            .select('*')
            .eq('id', programId)
            .single();
          
          if (programError) {
            console.error('[ProgramsAPI] Error fetching program:', programError);
            throw programError;
          }
          
          if (!program) {
            throw new Error(`Program not found: ${programId}`);
          }
          
          // Get fields for this program
          const { data: fields, error: fieldsError } = await supabase
            .from('program_fields')
            .select('*')
            .eq('program_id', programId)
            .order('order_index', { ascending: true });
          
          if (fieldsError) {
            console.error('[ProgramsAPI] Error fetching fields:', fieldsError);
            throw fieldsError;
          }
          
          console.log('[ProgramsAPI] Fields found:', fields?.length || 0);
          
          return {
            ...program,
            fields: fields || [],
          };
        },
        CACHE_TTL.PROGRAM_FIELDS
      );
      
      console.log('[ProgramsAPI] Program found:', result);
      return result;
    } catch (error: any) {
      console.error('[ProgramsAPI] Error fetching program:', error);
      console.error('[ProgramsAPI] Error stack:', error.stack);
      throw error;
    }
  },

  // Upload photo to Supabase Storage
  async uploadPhoto(file: File, userId: string, programId: string) {
    try {
      console.log('[ProgramsAPI] Uploading photo...', file.name);
      
      const bucket = 'make-28f2f653-program-photos';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${timestamp}-${randomId}.${fileExt}`;
      const filePath = `${userId}/${programId}/${fileName}`;
      
      console.log('[ProgramsAPI] Uploading to path:', filePath);
      
      // Upload with public access
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
          cacheControl: '3600',
        });
      
      if (error) {
        console.error('[ProgramsAPI] Upload error:', error);
        
        // If bucket doesn't exist, create it
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          console.log('[ProgramsAPI] Bucket not found, creating...');
          const { error: bucketError } = await supabase.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
          });
          
          if (bucketError && !bucketError.message.includes('already exists')) {
            console.error('[ProgramsAPI] Bucket creation error:', bucketError);
          }
          
          // Retry upload
          const { data: retryData, error: retryError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
              contentType: file.type || 'image/jpeg',
              upsert: false,
            });
          
          if (retryError) {
            throw new Error(`Upload failed: ${retryError.message}`);
          }
          
          console.log('[ProgramsAPI] ✅ Photo uploaded (retry):', filePath);
        } else {
          throw error;
        }
      } else {
        console.log('[ProgramsAPI] ✅ Photo uploaded:', filePath);
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      console.log('[ProgramsAPI] Photo URL:', urlData.publicUrl);
      
      return {
        success: true,
        path: filePath,
        url: urlData.publicUrl,
      };
    } catch (error: any) {
      console.error('[ProgramsAPI] Error uploading photo:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  },

  // Create submission
  async createSubmission(submission: any) {
    try {
      console.log('[ProgramsAPI] Creating submission...', submission);
      
      // ✅ FIXED: Use database tables instead of KV store
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          program_id: submission.program_id,
          user_id: submission.user_id,
          responses: submission.responses || {},
          status: submission.status || 'pending',
          gps_location: submission.location || null,
          photos: submission.photos || [],
          points_awarded: 0, // Pending approval
          submitted_at: submission.submitted_at || new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        console.error('[ProgramsAPI] Error creating submission:', error);
        throw error;
      }
      
      console.log('[ProgramsAPI] ✅ Submission created:', data.id);
      
      return {
        success: true,
        id: data.id,
        data: data,
      };
    } catch (error: any) {
      console.error('[ProgramsAPI] Error creating submission:', error);
      return {
        success: false,
        error: error.message || 'Failed to create submission',
      };
    }
  },

  // Get submissions for a program
  async getSubmissions(programId: string) {
    try {
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('program_id', programId)
        .order('submitted_at', { ascending: false });
      
      if (error) {
        console.error('[ProgramsAPI] Error fetching submissions:', error);
        throw error;
      }
      
      return submissions || [];
    } catch (error: any) {
      console.error('[ProgramsAPI] Error fetching submissions:', error);
      throw error;
    }
  },

  // Get submissions for a user
  async getUserSubmissions(userId: string) {
    try {
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });
      
      if (error) {
        console.error('[ProgramsAPI] Error fetching user submissions:', error);
        throw error;
      }
      
      return submissions || [];
    } catch (error: any) {
      console.error('[ProgramsAPI] Error fetching user submissions:', error);
      throw error;
    }
  },
};

// Initialize sample program if needed
export async function initializeSampleProgram() {
  try {
    // Check if sample program exists
    const existing = await kvStore.get(`${PROGRAMS_PREFIX}competitor-intel`);
    
    if (!existing) {
      console.log('[Init] Creating sample program...');
      
      // Create sample program
      const sampleProgram = {
        id: 'competitor-intel',
        title: 'Competitor Intel',
        description: 'Report competitor activity in your zone',
        icon: '🎯',
        color: '#EF4444',
        points_value: 100,
        target_roles: ['sales_executive', 'zonal_sales_manager', 'zonal_business_manager'],
        category: 'Network Experience',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await kvStore.set(`${PROGRAMS_PREFIX}competitor-intel`, sampleProgram);
      
      // Create sample fields
      const sampleFields = [
        {
          id: 'field-1',
          program_id: 'competitor-intel',
          field_name: 'competitor_name',
          field_label: 'Competitor Name',
          field_type: 'text',
          is_required: true,
          placeholder: 'e.g., Safaricom',
          order_index: 0,
        },
        {
          id: 'field-2',
          program_id: 'competitor-intel',
          field_name: 'activity_type',
          field_label: 'Activity Type',
          field_type: 'select',
          is_required: true,
          options: ['Promotion', 'New Product', 'Price Change', 'Store Opening', 'Other'],
          order_index: 1,
        },
        {
          id: 'field-3',
          program_id: 'competitor-intel',
          field_name: 'description',
          field_label: 'Description',
          field_type: 'textarea',
          is_required: true,
          placeholder: 'Describe what you observed...',
          order_index: 2,
        },
        {
          id: 'field-4',
          program_id: 'competitor-intel',
          field_name: 'photo',
          field_label: 'Photo Evidence',
          field_type: 'photo',
          is_required: false,
          help_text: 'Take a photo of the competitor activity',
          order_index: 3,
        },
      ];
      
      for (const field of sampleFields) {
        await kvStore.set(`${PROGRAM_FIELDS_PREFIX}${field.id}`, field);
      }
      
      console.log('[Init] ✅ Sample program created!');
    }
  } catch (error) {
    console.error('[Init] Error creating sample program:', error);
  }
}