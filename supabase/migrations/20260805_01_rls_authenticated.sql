-- ============================================================================
-- 20260805_01  Row level security for authenticated callers
-- ============================================================================
-- Prerequisite: the client must send a session token signed with the project
-- JWT secret. Until then every request arrives as anon and these policies will
-- return nothing. Order matters:
--
--   1. set SUPABASE_JWT_SECRET as an Edge Function secret
--   2. redeploy se-login so tokens are signed with it
--   3. deploy the frontend carrying the authedFetch change
--   4. confirm users can sign in and read data
--   5. only then apply this migration
--
-- Applying this before step 4 logs everyone out of their data.
--
-- 23 tables are scoped to the row owner.
-- 80 tables are readable by any signed-in user.
-- anon loses access to all of them. No data is deleted.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Owner scoped: a signed-in user sees only their own rows.
-- ---------------------------------------------------------------------------

revoke all on public."activity_logs" from anon;
grant select, insert, update on public."activity_logs" to authenticated;
alter table public."activity_logs" enable row level security;
drop policy if exists "activity_logs_own_read" on public."activity_logs";
create policy "activity_logs_own_read" on public."activity_logs"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "activity_logs_own_write" on public."activity_logs";
create policy "activity_logs_own_write" on public."activity_logs"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."am_videos" from anon;
grant select, insert, update on public."am_videos" to authenticated;
alter table public."am_videos" enable row level security;
drop policy if exists "am_videos_own_read" on public."am_videos";
create policy "am_videos_own_read" on public."am_videos"
  for select to authenticated using ("created_by"::text = auth.uid()::text);
drop policy if exists "am_videos_own_write" on public."am_videos";
create policy "am_videos_own_write" on public."am_videos"
  for insert to authenticated with check ("created_by"::text = auth.uid()::text);

revoke all on public."group_members" from anon;
grant select, insert, update on public."group_members" to authenticated;
alter table public."group_members" enable row level security;
drop policy if exists "group_members_own_read" on public."group_members";
create policy "group_members_own_read" on public."group_members"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "group_members_own_write" on public."group_members";
create policy "group_members_own_write" on public."group_members"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."group_messages" from anon;
grant select, insert, update on public."group_messages" to authenticated;
alter table public."group_messages" enable row level security;
drop policy if exists "group_messages_own_read" on public."group_messages";
create policy "group_messages_own_read" on public."group_messages"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "group_messages_own_write" on public."group_messages";
create policy "group_messages_own_write" on public."group_messages"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."groups" from anon;
grant select, insert, update on public."groups" to authenticated;
alter table public."groups" enable row level security;
drop policy if exists "groups_own_read" on public."groups";
create policy "groups_own_read" on public."groups"
  for select to authenticated using ("created_by"::text = auth.uid()::text);
drop policy if exists "groups_own_write" on public."groups";
create policy "groups_own_write" on public."groups"
  for insert to authenticated with check ("created_by"::text = auth.uid()::text);

revoke all on public."notifications" from anon;
grant select, insert, update on public."notifications" to authenticated;
alter table public."notifications" enable row level security;
drop policy if exists "notifications_own_read" on public."notifications";
create policy "notifications_own_read" on public."notifications"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "notifications_own_write" on public."notifications";
create policy "notifications_own_write" on public."notifications"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."otp_codes" from anon;
grant select, insert, update on public."otp_codes" to authenticated;
alter table public."otp_codes" enable row level security;
drop policy if exists "otp_codes_own_read" on public."otp_codes";
create policy "otp_codes_own_read" on public."otp_codes"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "otp_codes_own_write" on public."otp_codes";
create policy "otp_codes_own_write" on public."otp_codes"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."page_views" from anon;
grant select, insert, update on public."page_views" to authenticated;
alter table public."page_views" enable row level security;
drop policy if exists "page_views_own_read" on public."page_views";
create policy "page_views_own_read" on public."page_views"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "page_views_own_write" on public."page_views";
create policy "page_views_own_write" on public."page_views"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."password_changes" from anon;
grant select, insert, update on public."password_changes" to authenticated;
alter table public."password_changes" enable row level security;
drop policy if exists "password_changes_own_read" on public."password_changes";
create policy "password_changes_own_read" on public."password_changes"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "password_changes_own_write" on public."password_changes";
create policy "password_changes_own_write" on public."password_changes"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."phone_change_requests" from anon;
grant select, insert, update on public."phone_change_requests" to authenticated;
alter table public."phone_change_requests" enable row level security;
drop policy if exists "phone_change_requests_own_read" on public."phone_change_requests";
create policy "phone_change_requests_own_read" on public."phone_change_requests"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "phone_change_requests_own_write" on public."phone_change_requests";
create policy "phone_change_requests_own_write" on public."phone_change_requests"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."points_history" from anon;
grant select, insert, update on public."points_history" to authenticated;
alter table public."points_history" enable row level security;
drop policy if exists "points_history_own_read" on public."points_history";
create policy "points_history_own_read" on public."points_history"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "points_history_own_write" on public."points_history";
create policy "points_history_own_write" on public."points_history"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."program_top_performers" from anon;
grant select, insert, update on public."program_top_performers" to authenticated;
alter table public."program_top_performers" enable row level security;
drop policy if exists "program_top_performers_own_read" on public."program_top_performers";
create policy "program_top_performers_own_read" on public."program_top_performers"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "program_top_performers_own_write" on public."program_top_performers";
create policy "program_top_performers_own_write" on public."program_top_performers"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."programs" from anon;
grant select, insert, update on public."programs" to authenticated;
alter table public."programs" enable row level security;
drop policy if exists "programs_own_read" on public."programs";
create policy "programs_own_read" on public."programs"
  for select to authenticated using ("created_by"::text = auth.uid()::text);
drop policy if exists "programs_own_write" on public."programs";
create policy "programs_own_write" on public."programs"
  for insert to authenticated with check ("created_by"::text = auth.uid()::text);

revoke all on public."social_comments" from anon;
grant select, insert, update on public."social_comments" to authenticated;
alter table public."social_comments" enable row level security;
drop policy if exists "social_comments_own_read" on public."social_comments";
create policy "social_comments_own_read" on public."social_comments"
  for select to authenticated using ("author_id"::text = auth.uid()::text);
drop policy if exists "social_comments_own_write" on public."social_comments";
create policy "social_comments_own_write" on public."social_comments"
  for insert to authenticated with check ("author_id"::text = auth.uid()::text);

revoke all on public."social_likes" from anon;
grant select, insert, update on public."social_likes" to authenticated;
alter table public."social_likes" enable row level security;
drop policy if exists "social_likes_own_read" on public."social_likes";
create policy "social_likes_own_read" on public."social_likes"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "social_likes_own_write" on public."social_likes";
create policy "social_likes_own_write" on public."social_likes"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."social_posts" from anon;
grant select, insert, update on public."social_posts" to authenticated;
alter table public."social_posts" enable row level security;
drop policy if exists "social_posts_own_read" on public."social_posts";
create policy "social_posts_own_read" on public."social_posts"
  for select to authenticated using ("author_id"::text = auth.uid()::text);
drop policy if exists "social_posts_own_write" on public."social_posts";
create policy "social_posts_own_write" on public."social_posts"
  for insert to authenticated with check ("author_id"::text = auth.uid()::text);

revoke all on public."submission_threads" from anon;
grant select, insert, update on public."submission_threads" to authenticated;
alter table public."submission_threads" enable row level security;
drop policy if exists "submission_threads_own_read" on public."submission_threads";
create policy "submission_threads_own_read" on public."submission_threads"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "submission_threads_own_write" on public."submission_threads";
create policy "submission_threads_own_write" on public."submission_threads"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."submissions" from anon;
grant select, insert, update on public."submissions" to authenticated;
alter table public."submissions" enable row level security;
drop policy if exists "submissions_own_read" on public."submissions";
create policy "submissions_own_read" on public."submissions"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "submissions_own_write" on public."submissions";
create policy "submissions_own_write" on public."submissions"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."user_achievements" from anon;
grant select, insert, update on public."user_achievements" to authenticated;
alter table public."user_achievements" enable row level security;
drop policy if exists "user_achievements_own_read" on public."user_achievements";
create policy "user_achievements_own_read" on public."user_achievements"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "user_achievements_own_write" on public."user_achievements";
create policy "user_achievements_own_write" on public."user_achievements"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."user_actions" from anon;
grant select, insert, update on public."user_actions" to authenticated;
alter table public."user_actions" enable row level security;
drop policy if exists "user_actions_own_read" on public."user_actions";
create policy "user_actions_own_read" on public."user_actions"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "user_actions_own_write" on public."user_actions";
create policy "user_actions_own_write" on public."user_actions"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."user_call_status" from anon;
grant select, insert, update on public."user_call_status" to authenticated;
alter table public."user_call_status" enable row level security;
drop policy if exists "user_call_status_own_read" on public."user_call_status";
create policy "user_call_status_own_read" on public."user_call_status"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "user_call_status_own_write" on public."user_call_status";
create policy "user_call_status_own_write" on public."user_call_status"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."user_sessions" from anon;
grant select, insert, update on public."user_sessions" to authenticated;
alter table public."user_sessions" enable row level security;
drop policy if exists "user_sessions_own_read" on public."user_sessions";
create policy "user_sessions_own_read" on public."user_sessions"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "user_sessions_own_write" on public."user_sessions";
create policy "user_sessions_own_write" on public."user_sessions"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

revoke all on public."verification_codes" from anon;
grant select, insert, update on public."verification_codes" to authenticated;
alter table public."verification_codes" enable row level security;
drop policy if exists "verification_codes_own_read" on public."verification_codes";
create policy "verification_codes_own_read" on public."verification_codes"
  for select to authenticated using ("user_id"::text = auth.uid()::text);
drop policy if exists "verification_codes_own_write" on public."verification_codes";
create policy "verification_codes_own_write" on public."verification_codes"
  for insert to authenticated with check ("user_id"::text = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Reference data: readable by any signed-in user, writable by nobody from
-- the browser. Service role (Edge Functions) bypasses RLS and still writes.
-- ---------------------------------------------------------------------------

revoke all on public."DSE_14TOWNS" from anon;
grant select on public."DSE_14TOWNS" to authenticated;
alter table public."DSE_14TOWNS" enable row level security;
drop policy if exists "DSE_14TOWNS_auth_read" on public."DSE_14TOWNS";
create policy "DSE_14TOWNS_auth_read" on public."DSE_14TOWNS"
  for select to authenticated using (true);

revoke all on public."HBB_DSE_APRIL" from anon;
grant select on public."HBB_DSE_APRIL" to authenticated;
alter table public."HBB_DSE_APRIL" enable row level security;
drop policy if exists "HBB_DSE_APRIL_auth_read" on public."HBB_DSE_APRIL";
create policy "HBB_DSE_APRIL_auth_read" on public."HBB_DSE_APRIL"
  for select to authenticated using (true);

revoke all on public."HBB_DSE_GA_MONTHLY" from anon;
grant select on public."HBB_DSE_GA_MONTHLY" to authenticated;
alter table public."HBB_DSE_GA_MONTHLY" enable row level security;
drop policy if exists "HBB_DSE_GA_MONTHLY_auth_read" on public."HBB_DSE_GA_MONTHLY";
create policy "HBB_DSE_GA_MONTHLY_auth_read" on public."HBB_DSE_GA_MONTHLY"
  for select to authenticated using (true);

revoke all on public."HBB_HQ_TEAM" from anon;
grant select on public."HBB_HQ_TEAM" to authenticated;
alter table public."HBB_HQ_TEAM" enable row level security;
drop policy if exists "HBB_HQ_TEAM_auth_read" on public."HBB_HQ_TEAM";
create policy "HBB_HQ_TEAM_auth_read" on public."HBB_HQ_TEAM"
  for select to authenticated using (true);

revoke all on public."HBB_INSTALLER_GA_MONTHLY" from anon;
grant select on public."HBB_INSTALLER_GA_MONTHLY" to authenticated;
alter table public."HBB_INSTALLER_GA_MONTHLY" enable row level security;
drop policy if exists "HBB_INSTALLER_GA_MONTHLY_auth_read" on public."HBB_INSTALLER_GA_MONTHLY";
create policy "HBB_INSTALLER_GA_MONTHLY_auth_read" on public."HBB_INSTALLER_GA_MONTHLY"
  for select to authenticated using (true);

revoke all on public."INHOUSE_INSTALLER_6TOWNS_MARCH" from anon;
grant select on public."INHOUSE_INSTALLER_6TOWNS_MARCH" to authenticated;
alter table public."INHOUSE_INSTALLER_6TOWNS_MARCH" enable row level security;
drop policy if exists "INHOUSE_INSTALLER_6TOWNS_MARCH_auth_read" on public."INHOUSE_INSTALLER_6TOWNS_MARCH";
create policy "INHOUSE_INSTALLER_6TOWNS_MARCH_auth_read" on public."INHOUSE_INSTALLER_6TOWNS_MARCH"
  for select to authenticated using (true);

revoke all on public."NEW_SITES_JULY" from anon;
grant select on public."NEW_SITES_JULY" to authenticated;
alter table public."NEW_SITES_JULY" enable row level security;
drop policy if exists "NEW_SITES_JULY_auth_read" on public."NEW_SITES_JULY";
create policy "NEW_SITES_JULY_auth_read" on public."NEW_SITES_JULY"
  for select to authenticated using (true);

revoke all on public."Priority_sites" from anon;
grant select on public."Priority_sites" to authenticated;
alter table public."Priority_sites" enable row level security;
drop policy if exists "Priority_sites_auth_read" on public."Priority_sites";
create policy "Priority_sites_auth_read" on public."Priority_sites"
  for select to authenticated using (true);

revoke all on public."SE_MARCH" from anon;
grant select on public."SE_MARCH" to authenticated;
alter table public."SE_MARCH" enable row level security;
drop policy if exists "SE_MARCH_auth_read" on public."SE_MARCH";
create policy "SE_MARCH_auth_read" on public."SE_MARCH"
  for select to authenticated using (true);

revoke all on public."SITEWISE_MAY" from anon;
grant select on public."SITEWISE_MAY" to authenticated;
alter table public."SITEWISE_MAY" enable row level security;
drop policy if exists "SITEWISE_MAY_auth_read" on public."SITEWISE_MAY";
create policy "SITEWISE_MAY_auth_read" on public."SITEWISE_MAY"
  for select to authenticated using (true);

revoke all on public."ZSM_MARCH" from anon;
grant select on public."ZSM_MARCH" to authenticated;
alter table public."ZSM_MARCH" enable row level security;
drop policy if exists "ZSM_MARCH_auth_read" on public."ZSM_MARCH";
create policy "ZSM_MARCH_auth_read" on public."ZSM_MARCH"
  for select to authenticated using (true);

revoke all on public."achievements" from anon;
grant select on public."achievements" to authenticated;
alter table public."achievements" enable row level security;
drop policy if exists "achievements_auth_read" on public."achievements";
create policy "achievements_auth_read" on public."achievements"
  for select to authenticated using (true);

revoke all on public."agents_HBB" from anon;
grant select on public."agents_HBB" to authenticated;
alter table public."agents_HBB" enable row level security;
drop policy if exists "agents_HBB_auth_read" on public."agents_HBB";
create policy "agents_HBB_auth_read" on public."agents_HBB"
  for select to authenticated using (true);

revoke all on public."airtelmoney_agents" from anon;
grant select on public."airtelmoney_agents" to authenticated;
alter table public."airtelmoney_agents" enable row level security;
drop policy if exists "airtelmoney_agents_auth_read" on public."airtelmoney_agents";
create policy "airtelmoney_agents_auth_read" on public."airtelmoney_agents"
  for select to authenticated using (true);

revoke all on public."airtelmoney_hq" from anon;
grant select on public."airtelmoney_hq" to authenticated;
alter table public."airtelmoney_hq" enable row level security;
drop policy if exists "airtelmoney_hq_auth_read" on public."airtelmoney_hq";
create policy "airtelmoney_hq_auth_read" on public."airtelmoney_hq"
  for select to authenticated using (true);

revoke all on public."am_complaint_ratings" from anon;
grant select on public."am_complaint_ratings" to authenticated;
alter table public."am_complaint_ratings" enable row level security;
drop policy if exists "am_complaint_ratings_auth_read" on public."am_complaint_ratings";
create policy "am_complaint_ratings_auth_read" on public."am_complaint_ratings"
  for select to authenticated using (true);

revoke all on public."am_complaint_responses" from anon;
grant select on public."am_complaint_responses" to authenticated;
alter table public."am_complaint_responses" enable row level security;
drop policy if exists "am_complaint_responses_auth_read" on public."am_complaint_responses";
create policy "am_complaint_responses_auth_read" on public."am_complaint_responses"
  for select to authenticated using (true);

revoke all on public."am_complaints" from anon;
grant select on public."am_complaints" to authenticated;
alter table public."am_complaints" enable row level security;
drop policy if exists "am_complaints_auth_read" on public."am_complaints";
create policy "am_complaints_auth_read" on public."am_complaints"
  for select to authenticated using (true);

revoke all on public."am_video_sessions" from anon;
grant select on public."am_video_sessions" to authenticated;
alter table public."am_video_sessions" enable row level security;
drop policy if exists "am_video_sessions_auth_read" on public."am_video_sessions";
create policy "am_video_sessions_auth_read" on public."am_video_sessions"
  for select to authenticated using (true);

revoke all on public."am_video_targets" from anon;
grant select on public."am_video_targets" to authenticated;
alter table public."am_video_targets" enable row level security;
drop policy if exists "am_video_targets_auth_read" on public."am_video_targets";
create policy "am_video_targets_auth_read" on public."am_video_targets"
  for select to authenticated using (true);

revoke all on public."amb_shops" from anon;
grant select on public."amb_shops" to authenticated;
alter table public."amb_shops" enable row level security;
drop policy if exists "amb_shops_auth_read" on public."amb_shops";
create policy "amb_shops_auth_read" on public."amb_shops"
  for select to authenticated using (true);

revoke all on public."amb_sitewise" from anon;
grant select on public."amb_sitewise" to authenticated;
alter table public."amb_sitewise" enable row level security;
drop policy if exists "amb_sitewise_auth_read" on public."amb_sitewise";
create policy "amb_sitewise_auth_read" on public."amb_sitewise"
  for select to authenticated using (true);

revoke all on public."app_feature_flags" from anon;
grant select on public."app_feature_flags" to authenticated;
alter table public."app_feature_flags" enable row level security;
drop policy if exists "app_feature_flags_auth_read" on public."app_feature_flags";
create policy "app_feature_flags_auth_read" on public."app_feature_flags"
  for select to authenticated using (true);

revoke all on public."app_users" from anon;
grant select on public."app_users" to authenticated;
alter table public."app_users" enable row level security;
drop policy if exists "app_users_auth_read" on public."app_users";
create policy "app_users_auth_read" on public."app_users"
  for select to authenticated using (true);

revoke all on public."app_users_staging" from anon;
grant select on public."app_users_staging" to authenticated;
alter table public."app_users_staging" enable row level security;
drop policy if exists "app_users_staging_auth_read" on public."app_users_staging";
create policy "app_users_staging_auth_read" on public."app_users_staging"
  for select to authenticated using (true);

revoke all on public."app_versions" from anon;
grant select on public."app_versions" to authenticated;
alter table public."app_versions" enable row level security;
drop policy if exists "app_versions_auth_read" on public."app_versions";
create policy "app_versions_auth_read" on public."app_versions"
  for select to authenticated using (true);

revoke all on public."call_sessions" from anon;
grant select on public."call_sessions" to authenticated;
alter table public."call_sessions" enable row level security;
drop policy if exists "call_sessions_auth_read" on public."call_sessions";
create policy "call_sessions_auth_read" on public."call_sessions"
  for select to authenticated using (true);

revoke all on public."call_signals" from anon;
grant select on public."call_signals" to authenticated;
alter table public."call_signals" enable row level security;
drop policy if exists "call_signals_auth_read" on public."call_signals";
create policy "call_signals_auth_read" on public."call_signals"
  for select to authenticated using (true);

revoke all on public."challenges" from anon;
grant select on public."challenges" to authenticated;
alter table public."challenges" enable row level security;
drop policy if exists "challenges_auth_read" on public."challenges";
create policy "challenges_auth_read" on public."challenges"
  for select to authenticated using (true);

revoke all on public."director_messages" from anon;
grant select on public."director_messages" to authenticated;
alter table public."director_messages" enable row level security;
drop policy if exists "director_messages_auth_read" on public."director_messages";
create policy "director_messages_auth_read" on public."director_messages"
  for select to authenticated using (true);

revoke all on public."hbb_dse_ga_daily" from anon;
grant select on public."hbb_dse_ga_daily" to authenticated;
alter table public."hbb_dse_ga_daily" enable row level security;
drop policy if exists "hbb_dse_ga_daily_auth_read" on public."hbb_dse_ga_daily";
create policy "hbb_dse_ga_daily_auth_read" on public."hbb_dse_ga_daily"
  for select to authenticated using (true);

revoke all on public."hbb_dse_ga_monthly" from anon;
grant select on public."hbb_dse_ga_monthly" to authenticated;
alter table public."hbb_dse_ga_monthly" enable row level security;
drop policy if exists "hbb_dse_ga_monthly_auth_read" on public."hbb_dse_ga_monthly";
create policy "hbb_dse_ga_monthly_auth_read" on public."hbb_dse_ga_monthly"
  for select to authenticated using (true);

revoke all on public."hbb_ga_performance" from anon;
grant select on public."hbb_ga_performance" to authenticated;
alter table public."hbb_ga_performance" enable row level security;
drop policy if exists "hbb_ga_performance_auth_read" on public."hbb_ga_performance";
create policy "hbb_ga_performance_auth_read" on public."hbb_ga_performance"
  for select to authenticated using (true);

revoke all on public."hbb_ga_upload_batches" from anon;
grant select on public."hbb_ga_upload_batches" to authenticated;
alter table public."hbb_ga_upload_batches" enable row level security;
drop policy if exists "hbb_ga_upload_batches_auth_read" on public."hbb_ga_upload_batches";
create policy "hbb_ga_upload_batches_auth_read" on public."hbb_ga_upload_batches"
  for select to authenticated using (true);

revoke all on public."hbb_installer_ga_daily" from anon;
grant select on public."hbb_installer_ga_daily" to authenticated;
alter table public."hbb_installer_ga_daily" enable row level security;
drop policy if exists "hbb_installer_ga_daily_auth_read" on public."hbb_installer_ga_daily";
create policy "hbb_installer_ga_daily_auth_read" on public."hbb_installer_ga_daily"
  for select to authenticated using (true);

revoke all on public."hbb_installer_ga_monthly" from anon;
grant select on public."hbb_installer_ga_monthly" to authenticated;
alter table public."hbb_installer_ga_monthly" enable row level security;
drop policy if exists "hbb_installer_ga_monthly_auth_read" on public."hbb_installer_ga_monthly";
create policy "hbb_installer_ga_monthly_auth_read" on public."hbb_installer_ga_monthly"
  for select to authenticated using (true);

revoke all on public."hbb_installer_morning_checkins" from anon;
grant select on public."hbb_installer_morning_checkins" to authenticated;
alter table public."hbb_installer_morning_checkins" enable row level security;
drop policy if exists "hbb_installer_morning_checkins_auth_read" on public."hbb_installer_morning_checkins";
create policy "hbb_installer_morning_checkins_auth_read" on public."hbb_installer_morning_checkins"
  for select to authenticated using (true);

revoke all on public."hbb_installer_team_lead" from anon;
grant select on public."hbb_installer_team_lead" to authenticated;
alter table public."hbb_installer_team_lead" enable row level security;
drop policy if exists "hbb_installer_team_lead_auth_read" on public."hbb_installer_team_lead";
create policy "hbb_installer_team_lead_auth_read" on public."hbb_installer_team_lead"
  for select to authenticated using (true);

revoke all on public."hbb_teams" from anon;
grant select on public."hbb_teams" to authenticated;
alter table public."hbb_teams" enable row level security;
drop policy if exists "hbb_teams_auth_read" on public."hbb_teams";
create policy "hbb_teams_auth_read" on public."hbb_teams"
  for select to authenticated using (true);

revoke all on public."hbb_users" from anon;
grant select on public."hbb_users" to authenticated;
alter table public."hbb_users" enable row level security;
drop policy if exists "hbb_users_auth_read" on public."hbb_users";
create policy "hbb_users_auth_read" on public."hbb_users"
  for select to authenticated using (true);

revoke all on public."hq_directors" from anon;
grant select on public."hq_directors" to authenticated;
alter table public."hq_directors" enable row level security;
drop policy if exists "hq_directors_auth_read" on public."hq_directors";
create policy "hq_directors_auth_read" on public."hq_directors"
  for select to authenticated using (true);

revoke all on public."installer_live_locations" from anon;
grant select on public."installer_live_locations" to authenticated;
alter table public."installer_live_locations" enable row level security;
drop policy if exists "installer_live_locations_auth_read" on public."installer_live_locations";
create policy "installer_live_locations_auth_read" on public."installer_live_locations"
  for select to authenticated using (true);

revoke all on public."installer_notifications" from anon;
grant select on public."installer_notifications" to authenticated;
alter table public."installer_notifications" enable row level security;
drop policy if exists "installer_notifications_auth_read" on public."installer_notifications";
create policy "installer_notifications_auth_read" on public."installer_notifications"
  for select to authenticated using (true);

revoke all on public."installer_supervisor" from anon;
grant select on public."installer_supervisor" to authenticated;
alter table public."installer_supervisor" enable row level security;
drop policy if exists "installer_supervisor_auth_read" on public."installer_supervisor";
create policy "installer_supervisor_auth_read" on public."installer_supervisor"
  for select to authenticated using (true);

revoke all on public."installers" from anon;
grant select on public."installers" to authenticated;
alter table public."installers" enable row level security;
drop policy if exists "installers_auth_read" on public."installers";
create policy "installers_auth_read" on public."installers"
  for select to authenticated using (true);

revoke all on public."installers_HBB" from anon;
grant select on public."installers_HBB" to authenticated;
alter table public."installers_HBB" enable row level security;
drop policy if exists "installers_HBB_auth_read" on public."installers_HBB";
create policy "installers_HBB_auth_read" on public."installers_HBB"
  for select to authenticated using (true);

revoke all on public."job_issues" from anon;
grant select on public."job_issues" to authenticated;
alter table public."job_issues" enable row level security;
drop policy if exists "job_issues_auth_read" on public."job_issues";
create policy "job_issues_auth_read" on public."job_issues"
  for select to authenticated using (true);

revoke all on public."job_reviews" from anon;
grant select on public."job_reviews" to authenticated;
alter table public."job_reviews" enable row level security;
drop policy if exists "job_reviews_auth_read" on public."job_reviews";
create policy "job_reviews_auth_read" on public."job_reviews"
  for select to authenticated using (true);

revoke all on public."jobs" from anon;
grant select on public."jobs" to authenticated;
alter table public."jobs" enable row level security;
drop policy if exists "jobs_auth_read" on public."jobs";
create policy "jobs_auth_read" on public."jobs"
  for select to authenticated using (true);

revoke all on public."kv_store_28f2f653" from anon;
grant select on public."kv_store_28f2f653" to authenticated;
alter table public."kv_store_28f2f653" enable row level security;
drop policy if exists "kv_store_28f2f653_auth_read" on public."kv_store_28f2f653";
create policy "kv_store_28f2f653_auth_read" on public."kv_store_28f2f653"
  for select to authenticated using (true);

revoke all on public."location_tracking" from anon;
grant select on public."location_tracking" to authenticated;
alter table public."location_tracking" enable row level security;
drop policy if exists "location_tracking_auth_read" on public."location_tracking";
create policy "location_tracking_auth_read" on public."location_tracking"
  for select to authenticated using (true);

revoke all on public."mission_types" from anon;
grant select on public."mission_types" to authenticated;
alter table public."mission_types" enable row level security;
drop policy if exists "mission_types_auth_read" on public."mission_types";
create policy "mission_types_auth_read" on public."mission_types"
  for select to authenticated using (true);

revoke all on public."odu_config" from anon;
grant select on public."odu_config" to authenticated;
alter table public."odu_config" enable row level security;
drop policy if exists "odu_config_auth_read" on public."odu_config";
create policy "odu_config_auth_read" on public."odu_config"
  for select to authenticated using (true);

revoke all on public."odu_devices" from anon;
grant select on public."odu_devices" to authenticated;
alter table public."odu_devices" enable row level security;
drop policy if exists "odu_devices_auth_read" on public."odu_devices";
create policy "odu_devices_auth_read" on public."odu_devices"
  for select to authenticated using (true);

revoke all on public."odu_payment_batches" from anon;
grant select on public."odu_payment_batches" to authenticated;
alter table public."odu_payment_batches" enable row level security;
drop policy if exists "odu_payment_batches_auth_read" on public."odu_payment_batches";
create policy "odu_payment_batches_auth_read" on public."odu_payment_batches"
  for select to authenticated using (true);

revoke all on public."odu_requests" from anon;
grant select on public."odu_requests" to authenticated;
alter table public."odu_requests" enable row level security;
drop policy if exists "odu_requests_auth_read" on public."odu_requests";
create policy "odu_requests_auth_read" on public."odu_requests"
  for select to authenticated using (true);

revoke all on public."odu_staff" from anon;
grant select on public."odu_staff" to authenticated;
alter table public."odu_staff" enable row level security;
drop policy if exists "odu_staff_auth_read" on public."odu_staff";
create policy "odu_staff_auth_read" on public."odu_staff"
  for select to authenticated using (true);

revoke all on public."odu_upload_batches" from anon;
grant select on public."odu_upload_batches" to authenticated;
alter table public."odu_upload_batches" enable row level security;
drop policy if exists "odu_upload_batches_auth_read" on public."odu_upload_batches";
create policy "odu_upload_batches_auth_read" on public."odu_upload_batches"
  for select to authenticated using (true);

revoke all on public."odu_warehouses" from anon;
grant select on public."odu_warehouses" to authenticated;
alter table public."odu_warehouses" enable row level security;
drop policy if exists "odu_warehouses_auth_read" on public."odu_warehouses";
create policy "odu_warehouses_auth_read" on public."odu_warehouses"
  for select to authenticated using (true);

revoke all on public."org_change_log" from anon;
grant select on public."org_change_log" to authenticated;
alter table public."org_change_log" enable row level security;
drop policy if exists "org_change_log_auth_read" on public."org_change_log";
create policy "org_change_log_auth_read" on public."org_change_log"
  for select to authenticated using (true);

revoke all on public."program_analytics" from anon;
grant select on public."program_analytics" to authenticated;
alter table public."program_analytics" enable row level security;
drop policy if exists "program_analytics_auth_read" on public."program_analytics";
create policy "program_analytics_auth_read" on public."program_analytics"
  for select to authenticated using (true);

revoke all on public."program_daily_trends" from anon;
grant select on public."program_daily_trends" to authenticated;
alter table public."program_daily_trends" enable row level security;
drop policy if exists "program_daily_trends_auth_read" on public."program_daily_trends";
create policy "program_daily_trends_auth_read" on public."program_daily_trends"
  for select to authenticated using (true);

revoke all on public."program_fields" from anon;
grant select on public."program_fields" to authenticated;
alter table public."program_fields" enable row level security;
drop policy if exists "program_fields_auth_read" on public."program_fields";
create policy "program_fields_auth_read" on public."program_fields"
  for select to authenticated using (true);

revoke all on public."program_folders" from anon;
grant select on public."program_folders" to authenticated;
alter table public."program_folders" enable row level security;
drop policy if exists "program_folders_auth_read" on public."program_folders";
create policy "program_folders_auth_read" on public."program_folders"
  for select to authenticated using (true);

revoke all on public."promoter_daily_reports" from anon;
grant select on public."promoter_daily_reports" to authenticated;
alter table public."promoter_daily_reports" enable row level security;
drop policy if exists "promoter_daily_reports_auth_read" on public."promoter_daily_reports";
create policy "promoter_daily_reports_auth_read" on public."promoter_daily_reports"
  for select to authenticated using (true);

revoke all on public."promoter_gas_entries" from anon;
grant select on public."promoter_gas_entries" to authenticated;
alter table public."promoter_gas_entries" enable row level security;
drop policy if exists "promoter_gas_entries_auth_read" on public."promoter_gas_entries";
create policy "promoter_gas_entries_auth_read" on public."promoter_gas_entries"
  for select to authenticated using (true);

revoke all on public."promoter_members" from anon;
grant select on public."promoter_members" to authenticated;
alter table public."promoter_members" enable row level security;
drop policy if exists "promoter_members_auth_read" on public."promoter_members";
create policy "promoter_members_auth_read" on public."promoter_members"
  for select to authenticated using (true);

revoke all on public."promoter_team_leads" from anon;
grant select on public."promoter_team_leads" to authenticated;
alter table public."promoter_team_leads" enable row level security;
drop policy if exists "promoter_team_leads_auth_read" on public."promoter_team_leads";
create policy "promoter_team_leads_auth_read" on public."promoter_team_leads"
  for select to authenticated using (true);

revoke all on public."retailer_dump" from anon;
grant select on public."retailer_dump" to authenticated;
alter table public."retailer_dump" enable row level security;
drop policy if exists "retailer_dump_auth_read" on public."retailer_dump";
create policy "retailer_dump_auth_read" on public."retailer_dump"
  for select to authenticated using (true);

revoke all on public."retailer_dump_full" from anon;
grant select on public."retailer_dump_full" to authenticated;
alter table public."retailer_dump_full" enable row level security;
drop policy if exists "retailer_dump_full_auth_read" on public."retailer_dump_full";
create policy "retailer_dump_full_auth_read" on public."retailer_dump_full"
  for select to authenticated using (true);

revoke all on public."se_login_audit" from anon;
grant select on public."se_login_audit" to authenticated;
alter table public."se_login_audit" enable row level security;
drop policy if exists "se_login_audit_auth_read" on public."se_login_audit";
create policy "se_login_audit_auth_read" on public."se_login_audit"
  for select to authenticated using (true);

revoke all on public."service_request" from anon;
grant select on public."service_request" to authenticated;
alter table public."service_request" enable row level security;
drop policy if exists "service_request_auth_read" on public."service_request";
create policy "service_request_auth_read" on public."service_request"
  for select to authenticated using (true);

revoke all on public."shujaa_customers" from anon;
grant select on public."shujaa_customers" to authenticated;
alter table public."shujaa_customers" enable row level security;
drop policy if exists "shujaa_customers_auth_read" on public."shujaa_customers";
create policy "shujaa_customers_auth_read" on public."shujaa_customers"
  for select to authenticated using (true);

revoke all on public."sitewise" from anon;
grant select on public."sitewise" to authenticated;
alter table public."sitewise" enable row level security;
drop policy if exists "sitewise_auth_read" on public."sitewise";
create policy "sitewise_auth_read" on public."sitewise"
  for select to authenticated using (true);

revoke all on public."sitewise_lat_long" from anon;
grant select on public."sitewise_lat_long" to authenticated;
alter table public."sitewise_lat_long" enable row level security;
drop policy if exists "sitewise_lat_long_auth_read" on public."sitewise_lat_long";
create policy "sitewise_lat_long_auth_read" on public."sitewise_lat_long"
  for select to authenticated using (true);

revoke all on public."teams" from anon;
grant select on public."teams" to authenticated;
alter table public."teams" enable row level security;
drop policy if exists "teams_auth_read" on public."teams";
create policy "teams_auth_read" on public."teams"
  for select to authenticated using (true);

revoke all on public."upload_batches" from anon;
grant select on public."upload_batches" to authenticated;
alter table public."upload_batches" enable row level security;
drop policy if exists "upload_batches_auth_read" on public."upload_batches";
create policy "upload_batches_auth_read" on public."upload_batches"
  for select to authenticated using (true);

revoke all on public."user_follows" from anon;
grant select on public."user_follows" to authenticated;
alter table public."user_follows" enable row level security;
drop policy if exists "user_follows_auth_read" on public."user_follows";
create policy "user_follows_auth_read" on public."user_follows"
  for select to authenticated using (true);

revoke all on public."van_calendar_plans" from anon;
grant select on public."van_calendar_plans" to authenticated;
alter table public."van_calendar_plans" enable row level security;
drop policy if exists "van_calendar_plans_auth_read" on public."van_calendar_plans";
create policy "van_calendar_plans_auth_read" on public."van_calendar_plans"
  for select to authenticated using (true);

revoke all on public."van_db" from anon;
grant select on public."van_db" to authenticated;
alter table public."van_db" enable row level security;
drop policy if exists "van_db_auth_read" on public."van_db";
create policy "van_db_auth_read" on public."van_db"
  for select to authenticated using (true);

commit;
