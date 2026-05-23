import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';

/**
 * TEST COMPONENT - Verifies programs database is working
 * Delete this file after confirming everything works
 */
export function ProgramsTest() {
  const [status, setStatus] = useState<any>({
    loading: true,
    programs: null,
    fields: null,
    submissions: null,
    errors: {},
  });

  useEffect(() => {
    testDatabase();
  }, []);

  const testDatabase = async () => {
    console.log('🧪 [Programs Test] Starting database connection test...');
    
    const results: any = {
      loading: false,
      programs: null,
      fields: null,
      submissions: null,
      errors: {},
    };

    // Test 1: Query programs table
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .limit(5);
      
      if (error) {
        console.error('❌ [Programs Test] Programs table error:', error);
        results.errors.programs = error.message;
      } else {
        console.log('✅ [Programs Test] Programs table:', data?.length || 0, 'programs found');
        results.programs = data;
      }
    } catch (err: any) {
      console.error('❌ [Programs Test] Programs exception:', err);
      results.errors.programs = err.message;
    }

    // Test 2: Query program_fields table
    try {
      const { data, error } = await supabase
        .from('program_fields')
        .select('*')
        .limit(5);
      
      if (error) {
        console.error('❌ [Programs Test] Fields table error:', error);
        results.errors.fields = error.message;
      } else {
        console.log('✅ [Programs Test] Fields table:', data?.length || 0, 'fields found');
        results.fields = data;
      }
    } catch (err: any) {
      console.error('❌ [Programs Test] Fields exception:', err);
      results.errors.fields = err.message;
    }

    // Test 3: Query submissions table
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .limit(5);
      
      if (error) {
        console.error('❌ [Programs Test] Submissions table error:', error);
        results.errors.submissions = error.message;
      } else {
        console.log('✅ [Programs Test] Submissions table:', data?.length || 0, 'submissions found');
        results.submissions = data;
      }
    } catch (err: any) {
      console.error('❌ [Programs Test] Submissions exception:', err);
      results.errors.submissions = err.message;
    }

    console.log('🧪 [Programs Test] Test complete!', results);
    setStatus(results);
  };

  if (status.loading) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-4">
        <p className="text-yellow-800">🧪 Testing database connection...</p>
      </div>
    );
  }

  const hasErrors = Object.keys(status.errors).length > 0;

  return (
    <div className={`border-2 rounded-xl p-4 mb-4 ${hasErrors ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
      <h3 className={`font-bold mb-2 ${hasErrors ? 'text-red-900' : 'text-green-900'}`}>
        {hasErrors ? '❌ Database Test Failed' : '✅ Database Test Passed'}
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className={status.errors.programs ? 'text-red-700' : 'text-green-700'}>
          📊 Programs table: {status.errors.programs || `${status.programs?.length || 0} records`}
        </div>
        
        <div className={status.errors.fields ? 'text-red-700' : 'text-green-700'}>
          📝 Program fields table: {status.errors.fields || `${status.fields?.length || 0} records`}
        </div>
        
        <div className={status.errors.submissions ? 'text-red-700' : 'text-green-700'}>
          ✍️ Submissions table: {status.errors.submissions || `${status.submissions?.length || 0} records`}
        </div>
      </div>

      {!hasErrors && status.programs && status.programs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-green-300">
          <p className="text-green-800 font-semibold text-xs mb-1">Sample Program:</p>
          <div className="bg-white rounded p-2 text-xs">
            <div>📋 {status.programs[0].title}</div>
            <div className="text-gray-600 text-xs">{status.programs[0].description}</div>
          </div>
        </div>
      )}

      {hasErrors && (
        <div className="mt-3 pt-3 border-t border-red-300">
          <p className="text-red-800 font-semibold text-xs mb-1">Errors:</p>
          <pre className="bg-white rounded p-2 text-xs text-red-600 overflow-auto">
            {JSON.stringify(status.errors, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
