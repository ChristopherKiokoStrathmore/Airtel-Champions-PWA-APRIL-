import { useState } from 'react';
import { supabase } from '../utils/supabase/client';

export function DatabaseSchemaChecker({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const checkDatabase = async () => {
    setLoading(true);
    const checks: any = {};

    try {
      // Check app_users table structure
      console.log('🔍 Checking app_users table...');
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('*')
        .limit(1);

      checks.app_users = {
        exists: !usersError,
        error: usersError?.message,
        columns: usersData && usersData.length > 0 ? Object.keys(usersData[0]) : [],
        sample: usersData && usersData.length > 0 ? usersData[0] : null
      };

      // Check if specific profile columns exist
      if (usersData && usersData.length > 0) {
        const user = usersData[0];
        checks.profile_columns = {
          bio: 'bio' in user,
          avatar_url: 'avatar_url' in user,
          banner_url: 'banner_url' in user,
          created_at: 'created_at' in user
        };
      }

      // Check submissions table structure
      console.log('🔍 Checking submissions table...');
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .limit(1);

      checks.submissions = {
        exists: !submissionsError,
        error: submissionsError?.message,
        columns: submissionsData && submissionsData.length > 0 ? Object.keys(submissionsData[0]) : [],
        sample: submissionsData && submissionsData.length > 0 ? submissionsData[0] : null
      };

      // Check what user ID field exists in submissions
      if (submissionsData && submissionsData.length > 0) {
        const sub = submissionsData[0];
        checks.submissions_user_field = {
          agent_id: 'agent_id' in sub,
          user_id: 'user_id' in sub,
          author_id: 'author_id' in sub,
          employee_id: 'employee_id' in sub
        };
      }

      // Check social_posts table structure
      console.log('🔍 Checking social_posts table...');
      const { data: postsData, error: postsError } = await supabase
        .from('social_posts')
        .select('*')
        .limit(1);

      checks.social_posts = {
        exists: !postsError,
        error: postsError?.message,
        columns: postsData && postsData.length > 0 ? Object.keys(postsData[0]) : [],
        sample: postsData && postsData.length > 0 ? postsData[0] : null
      };

      // Check social_comments table structure
      console.log('🔍 Checking social_comments table...');
      const { data: commentsData, error: commentsError } = await supabase
        .from('social_comments')
        .select('*')
        .limit(1);

      checks.social_comments = {
        exists: !commentsError,
        error: commentsError?.message,
        columns: commentsData && commentsData.length > 0 ? Object.keys(commentsData[0]) : [],
        sample: commentsData && commentsData.length > 0 ? commentsData[0] : null
      };

      // Check social_likes table structure
      console.log('🔍 Checking social_likes table...');
      const { data: likesData, error: likesError } = await supabase
        .from('social_likes')
        .select('*')
        .limit(1);

      checks.social_likes = {
        exists: !likesError,
        error: likesError?.message,
        columns: likesData && likesData.length > 0 ? Object.keys(likesData[0]) : [],
        sample: likesData && likesData.length > 0 ? likesData[0] : null
      };

      // Check storage buckets
      console.log('🔍 Checking storage buckets...');
      const { data: bucketsData, error: bucketsError } = await supabase.storage.listBuckets();

      checks.storage_buckets = {
        exists: !bucketsError,
        error: bucketsError?.message,
        buckets: bucketsData?.map(b => b.name) || [],
        profile_pictures: bucketsData?.some(b => b.name === 'make-28f2f653-profile-pictures'),
        profile_banners: bucketsData?.some(b => b.name === 'make-28f2f653-profile-banners')
      };

      setResults(checks);
      console.log('✅ Database check complete:', checks);
    } catch (error) {
      console.error('❌ Error checking database:', error);
      checks.error = error;
      setResults(checks);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Database Schema Checker</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!results && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">Check Database Structure</h3>
              <p className="text-gray-600 mb-6">
                This tool will check your Supabase database schema and report any issues.
              </p>
              <button
                onClick={checkDatabase}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Checking...
                  </span>
                ) : (
                  'Run Database Check'
                )}
              </button>
            </div>
          )}

          {results && (
            <div className="space-y-6">
              {/* App Users Table */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {results.app_users?.exists ? '✅' : '❌'} app_users Table
                </h3>
                {results.app_users?.exists ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Columns ({results.app_users.columns.length}):</strong>
                    </p>
                    <div className="bg-white rounded p-3 font-mono text-xs overflow-x-auto">
                      {results.app_users.columns.join(', ')}
                    </div>
                    
                    {/* Profile Columns Check */}
                    {results.profile_columns && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold mb-2">Profile Columns:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-2 rounded ${results.profile_columns.bio ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {results.profile_columns.bio ? '✅' : '❌'} bio
                          </div>
                          <div className={`p-2 rounded ${results.profile_columns.avatar_url ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {results.profile_columns.avatar_url ? '✅' : '❌'} avatar_url
                          </div>
                          <div className={`p-2 rounded ${results.profile_columns.banner_url ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {results.profile_columns.banner_url ? '✅' : '❌'} banner_url
                          </div>
                          <div className={`p-2 rounded ${results.profile_columns.created_at ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {results.profile_columns.created_at ? '✅' : '❌'} created_at
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-red-600 text-sm">{results.app_users?.error}</p>
                )}
              </div>

              {/* Submissions Table */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {results.submissions?.exists ? '✅' : '❌'} submissions Table
                </h3>
                {results.submissions?.exists ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Columns ({results.submissions.columns.length}):</strong>
                    </p>
                    <div className="bg-white rounded p-3 font-mono text-xs overflow-x-auto">
                      {results.submissions.columns.join(', ')}
                    </div>
                    
                    {/* User ID Field Check */}
                    {results.submissions_user_field && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold mb-2">User ID Field:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-2 rounded ${results.submissions_user_field.agent_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {results.submissions_user_field.agent_id ? '✅ agent_id (FOUND)' : '❌ agent_id'}
                          </div>
                          <div className={`p-2 rounded ${results.submissions_user_field.user_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {results.submissions_user_field.user_id ? '✅ user_id (FOUND)' : '❌ user_id'}
                          </div>
                          <div className={`p-2 rounded ${results.submissions_user_field.author_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {results.submissions_user_field.author_id ? '✅ author_id (FOUND)' : '❌ author_id'}
                          </div>
                          <div className={`p-2 rounded ${results.submissions_user_field.employee_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {results.submissions_user_field.employee_id ? '✅ employee_id (FOUND)' : '❌ employee_id'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-red-600 text-sm">{results.submissions?.error}</p>
                )}
              </div>

              {/* Social Posts Table */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {results.social_posts?.exists ? '✅' : '❌'} social_posts Table
                </h3>
                {results.social_posts?.exists ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Columns ({results.social_posts.columns.length}):</strong>
                    </p>
                    <div className="bg-white rounded p-3 font-mono text-xs overflow-x-auto">
                      {results.social_posts.columns.join(', ')}
                    </div>
                  </div>
                ) : (
                  <p className="text-red-600 text-sm">{results.social_posts?.error}</p>
                )}
              </div>

              {/* Storage Buckets */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {results.storage_buckets?.exists ? '✅' : '❌'} Storage Buckets
                </h3>
                {results.storage_buckets?.exists ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Buckets found ({results.storage_buckets.buckets.length}):</strong>
                    </p>
                    <div className="bg-white rounded p-3 font-mono text-xs overflow-x-auto">
                      {results.storage_buckets.buckets.join(', ')}
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className={`p-2 rounded ${results.storage_buckets.profile_pictures ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {results.storage_buckets.profile_pictures ? '✅' : '❌'} make-28f2f653-profile-pictures
                      </div>
                      <div className={`p-2 rounded ${results.storage_buckets.profile_banners ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {results.storage_buckets.profile_banners ? '✅' : '❌'} make-28f2f653-profile-banners
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-600 text-sm">{results.storage_buckets?.error}</p>
                )}
              </div>

              {/* Raw Results */}
              <details className="bg-gray-50 rounded-xl p-4">
                <summary className="text-lg font-semibold cursor-pointer">Raw Results (Click to expand)</summary>
                <pre className="mt-3 bg-white rounded p-4 text-xs overflow-x-auto">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </details>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={checkDatabase}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Checking...' : 'Re-run Check'}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
                    alert('✅ Results copied to clipboard!');
                  }}
                  className="px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  📋 Copy Results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
