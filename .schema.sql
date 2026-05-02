-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.AIRTELMONEY_HQ (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  Name text,
  number numeric,
  PIN numeric,
  CONSTRAINT AIRTELMONEY_HQ_pkey PRIMARY KEY (id)
);
CREATE TABLE public.DSE_14TOWNS (
  ID bigint NOT NULL,
  Site ID text,
  Site Name text,
  Town text,
  DSE Name text,
  Estate Name text,
  WARD text,
  WARD ID text,
  Phone text,
  pin text,
  CONSTRAINT DSE_14TOWNS_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.HBB_DSE_APRIL (
  KYC MSISDN bigint NOT NULL,
  Category text,
  Town text,
  Name text,
  Team Leader text,
  Status text,
  CONSTRAINT HBB_DSE_APRIL_pkey PRIMARY KEY (KYC MSISDN),
  CONSTRAINT fk_hbb_dse_team_leader FOREIGN KEY (Team Leader) REFERENCES public.HBB_TEAM_LEAD(Team Leader)
);
CREATE TABLE public.HBB_DSE_GA_MONTHLY (
  id bigint NOT NULL DEFAULT nextval('"HBB_DSE_GA_MONTHLY_id_seq"'::regclass),
  dse_msisdn character varying NOT NULL,
  dse_name character varying NOT NULL,
  ga_count integer NOT NULL DEFAULT 0,
  incentive_earned numeric,
  current_band_min integer,
  current_band_max integer,
  team_lead_msisdn character varying,
  month_year character varying NOT NULL,
  town character varying,
  upload_id character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT HBB_DSE_GA_MONTHLY_pkey PRIMARY KEY (id)
);
CREATE TABLE public.HBB_HQ_TEAM (
  ID bigint NOT NULL,
  NAME text,
  PHONE bigint,
  ROLE text,
  pin numeric DEFAULT '1234'::numeric,
  CONSTRAINT HBB_HQ_TEAM_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.HBB_INSTALLER_GA_MONTHLY (
  id bigint NOT NULL DEFAULT nextval('"HBB_INSTALLER_GA_MONTHLY_id_seq"'::regclass),
  installer_msisdn character varying NOT NULL,
  installer_name character varying NOT NULL,
  ga_count integer NOT NULL DEFAULT 0,
  incentive_earned numeric,
  month_year character varying NOT NULL,
  upload_id character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PIN numeric DEFAULT '1234'::numeric,
  CONSTRAINT HBB_INSTALLER_GA_MONTHLY_pkey PRIMARY KEY (id)
);
CREATE TABLE public.HBB_TEAM_LEAD (
  Team Leader text UNIQUE,
  MSISDN bigint NOT NULL,
  CONSTRAINT HBB_TEAM_LEAD_pkey PRIMARY KEY (MSISDN)
);
CREATE TABLE public.INHOUSE_INSTALLER_6TOWNS_MARCH (
  ID bigint NOT NULL,
  Supervisor text,
  Estate Name text,
  Partner text,
  Installer name text,
  Installer contact bigint,
  KYC bigint,
  Alternative contact text,
  Zone text,
  PIN numeric DEFAULT '1234'::numeric,
  is_available boolean DEFAULT true,
  last_seen timestamp with time zone,
  last_known_lat double precision,
  last_known_lng double precision,
  current_job_id uuid,
  Town text,
  max_jobs_per_day integer NOT NULL DEFAULT 6,
  daily_job_count integer NOT NULL DEFAULT 0,
  last_reset_date date,
  Supervisor number numeric,
  Supervisor PIN numeric DEFAULT '1234'::numeric,
  CONSTRAINT INHOUSE_INSTALLER_6TOWNS_MARCH_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.NEW_SITES_APRIL (
  Sr. No bigint,
  SITE ID text NOT NULL,
  SITE NAME text,
  Latitude double precision,
  Longitude double precision,
  Parent ID text,
  WARD_ID text,
  WARD_NAME text,
  SUBCOUNTY text,
  COUNTY text,
  Town Cat text,
  Infill/Coverage text,
  CLUSTER text,
  TSE text,
  ZSM text,
  ZONE text,
  On Air Date text,
  CONSTRAINT NEW_SITES_APRIL_pkey PRIMARY KEY (SITE ID)
);
CREATE TABLE public.NEW_SITES_MARCH (
  Sr. No bigint NOT NULL,
  SITE ID text,
  SITE NAME text,
  Latitude double precision,
  Longitude double precision,
  WARD_NAME text,
  SUBCOUNTY text,
  COUNTY text,
  Town Cat text,
  Infill/Coverage text,
  CLUSTER text,
  TSE text,
  ZSM text,
  ZONE text,
  CONSTRAINT NEW_SITES_MARCH_pkey PRIMARY KEY (Sr. No)
);
CREATE TABLE public.Partner_vans (
  Van Reg text,
  Partner Name text NOT NULL,
  Van capacity bigint,
  ZSM text,
  Zone text,
  Category text,
  JUNE text,
  JULY text,
  AUG text,
  SEP text,
  OCT text,
  NOV text,
  DEC text,
  JAN text,
  LMTD text,
  MTD text,
  CONSTRAINT Partner_vans_pkey PRIMARY KEY (Partner Name)
);
CREATE TABLE public.Retailer_dump_3rd_march (
  RETAILER_MSISDN text NOT NULL,
  RETAILER_FIRST_NAME text,
  RETAILER_LAST_NAME text,
  CP_TYPE text,
  DSO text,
  SALES_APP_RETAILER_SITE_ID text,
  SITE_ID text,
  SITE_NAME text,
  TSE/SE text,
  ZSM text,
  ZBM text,
  ZONE text,
  CONSTRAINT Retailer_dump_3rd_march_pkey PRIMARY KEY (RETAILER_MSISDN)
);
CREATE TABLE public.SD_DASHBOARD (
  Numbers bigint NOT NULL,
  DISTRIBUTOR text,
  DSO ID bigint,
  CATEGORY text,
  Sites ID text,
  Site name text,
  USDM ID bigint,
  PARTNER TYPE text,
  TSE text,
  ZSM text,
  ZBM text,
  Gross Add Target Feb 2026 text,
  CONSTRAINT SD_DASHBOARD_pkey PRIMARY KEY (Numbers)
);
CREATE TABLE public.SE_MARCH (
  SE NAME text NOT NULL,
  TERRITORY text,
  SE MSISDNS text,
  ZSM NAME text,
  ZSM TERRITORY text,
  ZSM MSISDNS bigint,
  ZBM NAME text,
  ZBM MSISDNS bigint,
  ZONE text,
  CONSTRAINT SE_MARCH_pkey PRIMARY KEY (SE NAME)
);
CREATE TABLE public.ZSM_MARCH (
  ZSM NAME text NOT NULL,
  TERRITORY text,
  ZSM MSISDN bigint,
  ZBM text,
  ZBM MSISDNS bigint,
  ZONE text,
  CONSTRAINT ZSM_MARCH_pkey PRIMARY KEY (ZSM NAME)
);
CREATE TABLE public._inst_id (
  ID bigint
);
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  description text,
  icon character varying,
  points_required integer DEFAULT 0,
  tier character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT achievements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_name text,
  user_role text,
  action text NOT NULL,
  metadata jsonb,
  session_id text,
  device_info jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.agents_HBB (
  id bigint NOT NULL DEFAULT nextval('"agents_HBB_id_seq"'::regclass),
  Agent Name text,
  Agent Mobile Number bigint UNIQUE,
  Agent Type text DEFAULT 'DSE'::text,
  pin text DEFAULT '1234'::text,
  CONSTRAINT agents_HBB_pkey PRIMARY KEY (id)
);
CREATE TABLE public.airtelmoney_agents (
  id bigint NOT NULL DEFAULT nextval('airtelmoney_agents_id_seq'::regclass),
  full_name character varying NOT NULL,
  phone character varying NOT NULL UNIQUE,
  agent_code character varying,
  se character varying,
  zsm character varying,
  zone character varying,
  super_agent_number character varying,
  pin character varying NOT NULL,
  role character varying DEFAULT 'airtel_money_agent'::character varying,
  status character varying DEFAULT 'active'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  last_login_at timestamp without time zone,
  CONSTRAINT airtelmoney_agents_pkey PRIMARY KEY (id)
);
CREATE TABLE public.airtelmoney_hq (
  id bigint NOT NULL DEFAULT nextval('airtelmoney_hq_id_seq'::regclass),
  name character varying NOT NULL,
  phone character varying NOT NULL UNIQUE,
  pin character varying NOT NULL,
  role character varying DEFAULT 'airtel_money_admin'::character varying,
  se character varying,
  zsm character varying,
  zone character varying,
  status character varying DEFAULT 'active'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT airtelmoney_hq_pkey PRIMARY KEY (id)
);
CREATE TABLE public.am_complaint_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complaint_id uuid,
  agent_id bigint,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT am_complaint_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT am_complaint_ratings_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.am_complaints(id),
  CONSTRAINT am_complaint_ratings_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.airtelmoney_agents(id)
);
CREATE TABLE public.am_complaint_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complaint_id uuid,
  responder_id character varying,
  message text NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT am_complaint_responses_pkey PRIMARY KEY (id),
  CONSTRAINT am_complaint_responses_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.am_complaints(id)
);
CREATE TABLE public.am_complaints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id bigint,
  category character varying,
  description text NOT NULL,
  photo_url character varying,
  status character varying DEFAULT 'open'::character varying,
  picked_up_at timestamp without time zone,
  resolved_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT am_complaints_pkey PRIMARY KEY (id),
  CONSTRAINT am_complaints_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.airtelmoney_agents(id)
);
CREATE TABLE public.am_video_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id bigint,
  video_id uuid,
  session_start timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  session_end timestamp without time zone,
  max_position_secs integer DEFAULT 0,
  duration_watched_secs integer DEFAULT 0,
  completed boolean DEFAULT false,
  position_samples json DEFAULT '[]'::json,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT am_video_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT am_video_sessions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.airtelmoney_agents(id),
  CONSTRAINT am_video_sessions_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.am_videos(id)
);
CREATE TABLE public.am_video_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  video_id uuid,
  target_type character varying,
  target_value character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT am_video_targets_pkey PRIMARY KEY (id),
  CONSTRAINT am_video_targets_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.am_videos(id)
);
CREATE TABLE public.am_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  video_url character varying,
  thumbnail_url character varying,
  duration_seconds integer,
  category character varying DEFAULT 'General'::character varying,
  is_targeted boolean DEFAULT false,
  status character varying DEFAULT 'draft'::character varying,
  created_by bigint,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT am_videos_pkey PRIMARY KEY (id),
  CONSTRAINT am_videos_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.airtelmoney_hq(id)
);
CREATE TABLE public.amb_shops (
  shop_code text NOT NULL,
  fp_code text,
  partner_name text,
  usdm_name text,
  zsm text,
  shop_status text DEFAULT 'active'::text,
  closed_by text,
  closed_at timestamp with time zone,
  closure_reason text,
  reopened_by text,
  reopened_at timestamp with time zone,
  CONSTRAINT amb_shops_pkey PRIMARY KEY (shop_code)
);
CREATE TABLE public.amb_sitewise (
  SHOP CODE text,
  FP CODE text,
  PARTNER_NAME text,
  BUSINESS_NAME text,
  USDM_NAME text,
  SITE_CODE text NOT NULL,
  SITE_NAME text,
  CONSTRAINT amb_sitewise_pkey PRIMARY KEY (SITE_CODE),
  CONSTRAINT amb_sitewise_SITE_CODE_fkey FOREIGN KEY (SITE_CODE) REFERENCES public.sitewise(SITE ID)
);
CREATE TABLE public.app_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id character varying,
  full_name text NOT NULL,
  email text,
  phone_number character varying,
  role character varying,
  region text,
  zone text,
  zsm text,
  zbm text,
  rank integer DEFAULT 1,
  total_points integer DEFAULT 0,
  pin_hash text DEFAULT encode('\x31323334'::bytea, 'base64'::text),
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  last_login_at timestamp without time zone,
  login_count integer DEFAULT 0,
  is_locked boolean DEFAULT false,
  failed_attempts integer DEFAULT 0,
  job_title text,
  profile_picture text,
  bio text,
  avatar_url text,
  banner_url text,
  two_factor_enabled boolean DEFAULT false,
  gps_tracking_consent boolean DEFAULT false,
  profile_photo text,
  pin text DEFAULT '1234'::text,
  password_hash text,
  password_updated_at timestamp with time zone,
  source_table text DEFAULT 'app_users'::text,
  CONSTRAINT app_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.app_users_staging (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id character varying,
  full_name text NOT NULL,
  email text,
  phone_number character varying,
  role character varying,
  region text,
  zone text,
  zsm text,
  zbm text,
  rank integer DEFAULT 1,
  total_points integer DEFAULT 0,
  pin_hash text DEFAULT encode('\x31323334'::bytea, 'base64'::text),
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  last_login_at timestamp without time zone,
  login_count integer DEFAULT 0,
  is_locked boolean DEFAULT false,
  failed_attempts integer DEFAULT 0,
  job_title text,
  profile_picture text,
  bio text,
  avatar_url text,
  banner_url text,
  two_factor_enabled boolean DEFAULT false,
  gps_tracking_consent boolean DEFAULT false,
  profile_photo text,
  pin text DEFAULT '1234'::text,
  password_hash text,
  password_updated_at timestamp with time zone,
  CONSTRAINT app_users_staging_pkey PRIMARY KEY (id)
);
CREATE TABLE public.app_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  version character varying NOT NULL,
  bundle_url text NOT NULL,
  release_notes text,
  is_mandatory boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  platform character varying DEFAULT 'android'::character varying,
  CONSTRAINT app_versions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.call_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  caller_id uuid NOT NULL,
  callee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'ringing'::text CHECK (status = ANY (ARRAY['ringing'::text, 'active'::text, 'ended'::text, 'missed'::text, 'rejected'::text, 'failed'::text])),
  call_type text NOT NULL DEFAULT 'audio'::text CHECK (call_type = ANY (ARRAY['audio'::text, 'video'::text])),
  started_at timestamp with time zone DEFAULT now(),
  answered_at timestamp with time zone,
  ended_at timestamp with time zone,
  duration_seconds integer,
  ended_reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT call_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT call_sessions_caller_id_fkey FOREIGN KEY (caller_id) REFERENCES public.app_users(id),
  CONSTRAINT call_sessions_callee_id_fkey FOREIGN KEY (callee_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.call_signals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  call_session_id uuid NOT NULL,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  signal_type text NOT NULL CHECK (signal_type = ANY (ARRAY['offer'::text, 'answer'::text, 'ice_candidate'::text, 'hang_up'::text])),
  signal_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  read boolean DEFAULT false,
  CONSTRAINT call_signals_pkey PRIMARY KEY (id),
  CONSTRAINT call_signals_call_session_id_fkey FOREIGN KEY (call_session_id) REFERENCES public.call_sessions(id),
  CONSTRAINT call_signals_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.app_users(id),
  CONSTRAINT call_signals_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  Sr. No integer NOT NULL DEFAULT nextval('"challenges_Sr. No_seq"'::regclass),
  SITE ID character varying,
  SITE NAME character varying,
  Latitude numeric,
  Longitude numeric,
  WARD_NAME character varying,
  SUBCOUNTY character varying,
  COUNTY character varying,
  Town Cat character varying,
  Infill/Coverage character varying,
  CLUSTER character varying,
  TSE character varying,
  ZSM character varying,
  ZONE character varying,
  CONSTRAINT challenges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.director_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid,
  sender_name text NOT NULL,
  sender_role text,
  sender_zone text,
  message text NOT NULL,
  category text,
  is_anonymous boolean DEFAULT false,
  status text DEFAULT 'unread'::text CHECK (status = ANY (ARRAY['unread'::text, 'read'::text, 'replied'::text, 'archived'::text])),
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  attachments jsonb DEFAULT '[]'::jsonb,
  actual_sender_id uuid,
  visible_to jsonb DEFAULT '["all"]'::jsonb,
  subject text,
  priority text DEFAULT 'normal'::text CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])),
  reply_to uuid,
  director_reaction text,
  ashish_reply text,
  ashish_reply_time timestamp with time zone,
  ashish_reaction text,
  CONSTRAINT director_messages_pkey PRIMARY KEY (id),
  CONSTRAINT director_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.app_users(id),
  CONSTRAINT director_messages_actual_sender_id_fkey FOREIGN KEY (actual_sender_id) REFERENCES public.app_users(id),
  CONSTRAINT director_messages_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES public.director_messages(id)
);
CREATE TABLE public.estate_neighbours (
  estate_name text NOT NULL,
  neighbour_name text NOT NULL,
  town text NOT NULL,
  priority integer NOT NULL DEFAULT 1,
  distance_km integer NOT NULL DEFAULT 1,
  walking_mins integer,
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT estate_neighbours_pkey PRIMARY KEY (estate_name, neighbour_name)
);
CREATE TABLE public.group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role character varying NOT NULL DEFAULT 'member'::character varying CHECK (role::text = ANY (ARRAY['admin'::character varying, 'member'::character varying]::text[])),
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT group_members_pkey PRIMARY KEY (id),
  CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.group_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  message text,
  photos ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT group_messages_pkey PRIMARY KEY (id),
  CONSTRAINT group_messages_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  icon character varying DEFAULT '👥'::character varying,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['personal'::character varying, 'official'::character varying]::text[])),
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT groups_pkey PRIMARY KEY (id),
  CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.app_users(id)
);
CREATE TABLE public.hashtags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tag text NOT NULL UNIQUE,
  post_count integer DEFAULT 0,
  first_used_at timestamp with time zone DEFAULT now(),
  last_used_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hashtags_pkey PRIMARY KEY (id)
);
CREATE TABLE public.hbb_dse_ga_daily (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dse_msisdn text NOT NULL,
  dse_name text,
  town text,
  ga_date date NOT NULL,
  ga_count integer NOT NULL DEFAULT 0,
  report_batch_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hbb_dse_ga_daily_pkey PRIMARY KEY (id),
  CONSTRAINT hbb_dse_ga_daily_report_batch_id_fkey FOREIGN KEY (report_batch_id) REFERENCES public.hbb_ga_upload_batches(id)
);
CREATE TABLE public.hbb_dse_ga_monthly (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dse_msisdn text NOT NULL,
  dse_name text NOT NULL,
  team_lead_msisdn text,
  town text,
  ga_count integer NOT NULL DEFAULT 0,
  current_band_min integer DEFAULT 0,
  current_band_max integer DEFAULT 0,
  incentive_earned integer DEFAULT 0,
  report_batch_id uuid,
  month_year text NOT NULL,
  upload_date timestamp with time zone,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hbb_dse_ga_monthly_pkey PRIMARY KEY (id),
  CONSTRAINT hbb_dse_ga_monthly_report_batch_id_fkey FOREIGN KEY (report_batch_id) REFERENCES public.hbb_ga_upload_batches(id)
);
CREATE TABLE public.hbb_ga_calendar (
  ga_date date NOT NULL,
  month_year text NOT NULL,
  day_name text NOT NULL,
  CONSTRAINT hbb_ga_calendar_pkey PRIMARY KEY (ga_date)
);
CREATE TABLE public.hbb_ga_performance (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  dse_msisdn character varying NOT NULL,
  ga_count integer NOT NULL DEFAULT 0,
  incentive_earned numeric NOT NULL DEFAULT 0,
  month_year character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hbb_ga_performance_pkey PRIMARY KEY (id)
);
CREATE TABLE public.hbb_ga_upload_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  report_type text NOT NULL CHECK (report_type = ANY (ARRAY['dse_ga'::text, 'installer_ga'::text])),
  status text NOT NULL DEFAULT 'staged'::text CHECK (status = ANY (ARRAY['staged'::text, 'live'::text, 'rolled_back'::text])),
  table_source text NOT NULL DEFAULT 'HBB_DSE_APRIL'::text,
  total_records integer DEFAULT 0,
  warnings_count integer DEFAULT 0,
  validation_errors jsonb DEFAULT '[]'::jsonb,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  went_live_at timestamp with time zone,
  rolled_back_at timestamp with time zone,
  rolled_back_reason text,
  CONSTRAINT hbb_ga_upload_batches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.hbb_ga_upload_history (
  id text NOT NULL,
  file_name text NOT NULL,
  uploaded_by text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'success'::text, 'failed'::text, 'rolled_back'::text])),
  row_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT hbb_ga_upload_history_pkey PRIMARY KEY (id)
);
CREATE TABLE public.hbb_ga_upload_warnings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  row_number integer NOT NULL,
  phone_number text,
  name text,
  issue_type text NOT NULL CHECK (issue_type = ANY (ARRAY['phone_format_invalid'::text, 'person_not_found'::text, 'duplicate_same_day'::text, 'name_mismatch'::text])),
  severity text NOT NULL DEFAULT 'warning'::text CHECK (severity = ANY (ARRAY['error'::text, 'warning'::text])),
  message text NOT NULL,
  suggested_action text,
  resolved boolean NOT NULL DEFAULT false,
  resolution_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hbb_ga_upload_warnings_pkey PRIMARY KEY (id),
  CONSTRAINT hbb_ga_upload_warnings_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.hbb_ga_upload_batches(id)
);
CREATE TABLE public.hbb_incentive_bands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_type text NOT NULL CHECK (role_type = ANY (ARRAY['dse'::text, 'dse_tl'::text, 'installer'::text, 'installer_tl'::text])),
  band_name text NOT NULL,
  ga_range_min integer NOT NULL,
  ga_range_max integer NOT NULL,
  split_percentage numeric DEFAULT 0,
  mid_value numeric DEFAULT 0,
  variable_value integer DEFAULT 0,
  total_bonus integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hbb_incentive_bands_pkey PRIMARY KEY (id)
);
CREATE TABLE public.hbb_installer_ga_daily (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  installer_msisdn text NOT NULL,
  installer_name text,
  town text,
  ga_date date NOT NULL,
  ga_count integer NOT NULL DEFAULT 0,
  report_batch_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hbb_installer_ga_daily_pkey PRIMARY KEY (id),
  CONSTRAINT hbb_installer_ga_daily_report_batch_id_fkey FOREIGN KEY (report_batch_id) REFERENCES public.hbb_ga_upload_batches(id)
);
CREATE TABLE public.hbb_installer_ga_monthly (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  installer_msisdn text NOT NULL,
  installer_name text NOT NULL,
  team_lead_msisdn text,
  town text,
  ga_count integer NOT NULL DEFAULT 0,
  current_band_min integer DEFAULT 0,
  current_band_max integer DEFAULT 0,
  incentive_earned integer DEFAULT 0,
  report_batch_id uuid,
  month_year text NOT NULL,
  upload_date timestamp with time zone,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hbb_installer_ga_monthly_pkey PRIMARY KEY (id),
  CONSTRAINT hbb_installer_ga_monthly_team_lead_msisdn_fkey FOREIGN KEY (team_lead_msisdn) REFERENCES public.hbb_installer_team_lead(team_lead_msisdn),
  CONSTRAINT hbb_installer_ga_monthly_report_batch_id_fkey FOREIGN KEY (report_batch_id) REFERENCES public.hbb_ga_upload_batches(id)
);
CREATE TABLE public.hbb_installer_team_lead (
  team_lead_msisdn text NOT NULL,
  team_lead_name text NOT NULL,
  town text,
  zone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT hbb_installer_team_lead_pkey PRIMARY KEY (team_lead_msisdn)
);
CREATE TABLE public.hbb_teams (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  team_lead_msisdn character varying NOT NULL,
  dse_msisdn character varying NOT NULL,
  month_year character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hbb_teams_pkey PRIMARY KEY (id),
  CONSTRAINT hbb_teams_team_lead_msisdn_fkey FOREIGN KEY (team_lead_msisdn) REFERENCES public.hbb_users(msisdn),
  CONSTRAINT hbb_teams_dse_msisdn_fkey FOREIGN KEY (dse_msisdn) REFERENCES public.hbb_users(msisdn)
);
CREATE TABLE public.hbb_users (
  msisdn character varying NOT NULL,
  name character varying NOT NULL,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['dse'::character varying, 'team_lead'::character varying, 'manager'::character varying, 'admin'::character varying]::text[])),
  team_lead_msisdn character varying,
  area_code character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hbb_users_pkey PRIMARY KEY (msisdn)
);
CREATE TABLE public.hq_directors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone_number text NOT NULL UNIQUE,
  email text,
  role text NOT NULL CHECK (role = ANY (ARRAY['HQ'::text, 'Director'::text])),
  job_title text,
  region text,
  is_active boolean DEFAULT true,
  pin text DEFAULT '1234'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hq_directors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.installer_live_locations (
  id bigint NOT NULL DEFAULT nextval('installer_live_locations_id_seq'::regclass),
  installer_id bigint NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT installer_live_locations_pkey PRIMARY KEY (id),
  CONSTRAINT installer_live_locations_installer_id_fkey FOREIGN KEY (installer_id) REFERENCES public.INHOUSE_INSTALLER_6TOWNS_MARCH(ID)
);
CREATE TABLE public.installer_locations (
  id uuid DEFAULT gen_random_uuid(),
  installer_id bigint NOT NULL,
  job_id uuid NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy double precision,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT installer_locations_installer_id_fkey1 FOREIGN KEY (installer_id) REFERENCES public.INHOUSE_INSTALLER_6TOWNS_MARCH(ID),
  CONSTRAINT installer_locations_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.installer_locations_2026_w13 (
  id uuid DEFAULT gen_random_uuid(),
  installer_id bigint NOT NULL,
  job_id uuid NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy double precision,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT installer_locations_installer_id_fkey1 FOREIGN KEY (installer_id) REFERENCES public.INHOUSE_INSTALLER_6TOWNS_MARCH(ID),
  CONSTRAINT installer_locations_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.installer_locations_2026_w14 (
  id uuid DEFAULT gen_random_uuid(),
  installer_id bigint NOT NULL,
  job_id uuid NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy double precision,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT installer_locations_installer_id_fkey1 FOREIGN KEY (installer_id) REFERENCES public.INHOUSE_INSTALLER_6TOWNS_MARCH(ID),
  CONSTRAINT installer_locations_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.installer_locations_archive (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  installer_id bigint NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy double precision,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT installer_locations_archive_pkey PRIMARY KEY (id),
  CONSTRAINT installer_locations_installer_id_fkey FOREIGN KEY (installer_id) REFERENCES public.INHOUSE_INSTALLER_6TOWNS_MARCH(ID)
);
CREATE TABLE public.installer_notifications (
  id bigint NOT NULL DEFAULT nextval('installer_notifications_id_seq'::regclass),
  installer_id text NOT NULL,
  job_id uuid,
  type text NOT NULL DEFAULT 'new_job'::text,
  title text NOT NULL,
  body text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT installer_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT installer_notifications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.installer_supervisor (
  Installers supervisor text NOT NULL,
  Phone text NOT NULL,
  pin numeric DEFAULT '1234'::numeric,
  CONSTRAINT installer_supervisor_pkey PRIMARY KEY (Installers supervisor)
);
CREATE TABLE public.installers (
  id bigint NOT NULL DEFAULT nextval('installers_id_seq'::regclass),
  name text NOT NULL,
  phone text NOT NULL,
  town text,
  estate text,
  lat double precision,
  lng double precision,
  status text NOT NULL DEFAULT 'available'::text,
  max_jobs_per_day integer NOT NULL DEFAULT 6,
  pin text NOT NULL DEFAULT '1234'::text,
  is_available boolean NOT NULL DEFAULT true,
  current_job_id uuid,
  source_table text,
  legacy_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  unique_identifier text,
  CONSTRAINT installers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.installers_HBB (
  id bigint NOT NULL DEFAULT nextval('"installers_HBB_id_seq"'::regclass),
  name text,
  phone text UNIQUE,
  pin text DEFAULT '1234'::text,
  town_id bigint,
  status text DEFAULT 'active'::text,
  max_jobs_per_day integer DEFAULT 6,
  CONSTRAINT installers_HBB_pkey PRIMARY KEY (id)
);
CREATE TABLE public.installers_availability (
  installer_id bigint NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  current_job_id uuid,
  daily_job_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT installers_availability_pkey PRIMARY KEY (installer_id),
  CONSTRAINT installers_availability_installer_id_fkey FOREIGN KEY (installer_id) REFERENCES public.INHOUSE_INSTALLER_6TOWNS_MARCH(ID),
  CONSTRAINT installers_availability_current_job_id_fkey FOREIGN KEY (current_job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.job_issues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  customer_phone text NOT NULL,
  issue_type text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  resolution_notes text,
  CONSTRAINT job_issues_pkey PRIMARY KEY (id),
  CONSTRAINT job_issues_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.job_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  installer_id bigint,
  customer_phone text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT job_reviews_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_reviews_installer_id_fkey FOREIGN KEY (installer_id) REFERENCES public.INHOUSE_INSTALLER_6TOWNS_MARCH(ID)
);
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_phone text NOT NULL,
  customer_name text,
  town text,
  estate_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'assigned'::text, 'on_way'::text, 'arrived'::text, 'completed'::text, 'cancelled'::text, 'scheduled'::text, 'pending_escalation'::text, 'pending_reassignment'::text, 'open'::text, 'failed'::text, 'rescheduled'::text, 'unreachable'::text, 'not_ready'::text])),
  installer_id bigint,
  requested_at timestamp with time zone DEFAULT now(),
  assigned_at timestamp with time zone,
  on_way_at timestamp with time zone,
  arrived_at timestamp with time zone,
  completed_at timestamp with time zone,
  before_photo_url text,
  after_photo_url text,
  created_at timestamp with time zone DEFAULT now(),
  customer_lat double precision,
  customer_lng double precision,
  street_address text,
  landmark text,
  building text,
  Estate text,
  package text,
  scheduled_date text,
  zone text,
  scheduled_time text,
  service_request_id bigint,
  source_type text DEFAULT 'public'::text CHECK (source_type = ANY (ARRAY['dse'::text, 'public'::text, 'agent'::text])),
  source_id bigint,
  source_name text,
  sr_number bigint,
  rejected_by ARRAY NOT NULL DEFAULT '{}'::bigint[],
  agent_name text,
  agent_phone text,
  remarks text,
  completion_lat double precision,
  completion_lng double precision,
  legacy_sr_id bigint,
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_installer_id_fkey FOREIGN KEY (installer_id) REFERENCES public.installers(id),
  CONSTRAINT jobs_service_request_id_fkey FOREIGN KEY (service_request_id) REFERENCES public.service_request(id)
);
CREATE TABLE public.kv_store_28f2f653 (
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT kv_store_28f2f653_pkey PRIMARY KEY (key)
);
CREATE TABLE public.kv_store_9ea3f468 (
  key text NOT NULL,
  value jsonb NOT NULL,
  CONSTRAINT kv_store_9ea3f468_pkey PRIMARY KEY (key)
);
CREATE TABLE public.kv_store_c9fd4e51 (
  key text NOT NULL,
  value jsonb NOT NULL,
  CONSTRAINT kv_store_c9fd4e51_pkey PRIMARY KEY (key)
);
CREATE TABLE public.kv_store_e446c708 (
  key text NOT NULL,
  value jsonb NOT NULL,
  CONSTRAINT kv_store_e446c708_pkey PRIMARY KEY (key)
);
CREATE TABLE public.location_tracking (
  id bigint NOT NULL DEFAULT nextval('location_tracking_id_seq'::regclass),
  job_id uuid NOT NULL,
  installer_id text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  accuracy_m numeric,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT location_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT location_tracking_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.mission_types (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  description text,
  base_points integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  category character varying,
  icon character varying,
  color character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mission_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  recipient_role text,
  type text NOT NULL,
  message text NOT NULL,
  title text,
  read boolean DEFAULT false,
  is_read boolean DEFAULT false,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.org_change_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  change_batch_id uuid,
  phone_number text NOT NULL,
  user_name text NOT NULL,
  change_type text NOT NULL CHECK (change_type = ANY (ARRAY['new_user'::text, 'removed_user'::text, 'role_change'::text, 'zone_transfer'::text])),
  old_value jsonb,
  new_value jsonb,
  effective_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT org_change_log_pkey PRIMARY KEY (id),
  CONSTRAINT org_change_log_change_batch_id_fkey FOREIGN KEY (change_batch_id) REFERENCES public.upload_batches(id)
);
CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid,
  page_name character varying NOT NULL,
  page_url character varying,
  time_spent_seconds integer DEFAULT 0,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT page_views_pkey PRIMARY KEY (id),
  CONSTRAINT page_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id),
  CONSTRAINT page_views_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.user_sessions(id)
);
CREATE TABLE public.password_changes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text,
  changed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT password_changes_pkey PRIMARY KEY (id),
  CONSTRAINT password_changes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.phone_change_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id text,
  current_phone text NOT NULL,
  requested_phone text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  requested_by_role text,
  approver_role text,
  approved_by uuid,
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT phone_change_requests_pkey PRIMARY KEY (id),
  CONSTRAINT phone_change_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.point_config (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mission_type_id uuid NOT NULL,
  base_points integer NOT NULL DEFAULT 0,
  hotspot_multiplier numeric DEFAULT 1.5,
  weekend_multiplier numeric DEFAULT 1.2,
  early_bird_multiplier numeric DEFAULT 1.1,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT point_config_pkey PRIMARY KEY (id),
  CONSTRAINT point_config_mission_type_id_fkey FOREIGN KEY (mission_type_id) REFERENCES public.mission_types(id)
);
CREATE TABLE public.points_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  source text,
  source_id uuid,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT points_history_pkey PRIMARY KEY (id),
  CONSTRAINT points_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.program_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  total_submissions integer DEFAULT 0,
  approved_submissions integer DEFAULT 0,
  rejected_submissions integer DEFAULT 0,
  pending_submissions integer DEFAULT 0,
  total_points_awarded integer DEFAULT 0,
  unique_submitters integer DEFAULT 0,
  avg_submissions_per_user numeric DEFAULT 0,
  completion_rate numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT program_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT program_analytics_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id)
);
CREATE TABLE public.program_daily_trends (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  submission_date date NOT NULL,
  submission_count integer DEFAULT 0,
  points_awarded integer DEFAULT 0,
  unique_users integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT program_daily_trends_pkey PRIMARY KEY (id),
  CONSTRAINT program_daily_trends_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id)
);
CREATE TABLE public.program_fields (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  program_id uuid,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL,
  is_required boolean DEFAULT false,
  placeholder text,
  help_text text,
  options jsonb,
  validation jsonb,
  conditional_logic jsonb,
  order_index integer DEFAULT 0,
  section_id text,
  section_title text,
  section_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT program_fields_pkey PRIMARY KEY (id),
  CONSTRAINT program_fields_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id)
);
CREATE TABLE public.program_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT '📁'::text,
  color text DEFAULT '#6366F1'::text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT program_folders_pkey PRIMARY KEY (id)
);
CREATE TABLE public.program_top_performers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  user_id uuid NOT NULL,
  submission_count integer DEFAULT 0,
  total_points integer DEFAULT 0,
  last_submission_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT program_top_performers_pkey PRIMARY KEY (id),
  CONSTRAINT program_top_performers_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id),
  CONSTRAINT program_top_performers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.programs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  icon text DEFAULT '📊'::text,
  color text DEFAULT '#EF4444'::text,
  points_value integer DEFAULT 50,
  target_roles ARRAY DEFAULT ARRAY['sales_executive'::text],
  category text DEFAULT 'Network Experience'::text,
  status text DEFAULT 'active'::text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  who_can_submit ARRAY DEFAULT ARRAY['sales_executive'::text],
  points_enabled boolean DEFAULT true,
  system_id text UNIQUE,
  gps_auto_detect_enabled boolean DEFAULT true,
  zone_filtering_enabled boolean DEFAULT false,
  progressive_disclosure_enabled boolean DEFAULT false,
  van_checkout_enforcement_enabled boolean DEFAULT false,
  linked_checkin_program_id text,
  session_checkin_enabled boolean DEFAULT false,
  CONSTRAINT programs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.promoter_daily_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  team_lead_id uuid NOT NULL,
  report_date date NOT NULL,
  total_gas integer NOT NULL DEFAULT 0,
  is_locked boolean NOT NULL DEFAULT false,
  submitted_at timestamp with time zone,
  CONSTRAINT promoter_daily_reports_pkey PRIMARY KEY (id),
  CONSTRAINT promoter_daily_reports_team_lead_id_fkey FOREIGN KEY (team_lead_id) REFERENCES public.promoter_team_leads(id)
);
CREATE TABLE public.promoter_gas_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL,
  team_lead_id uuid NOT NULL,
  promoter_msisdn text NOT NULL,
  promoter_name text NOT NULL,
  ga_count integer NOT NULL DEFAULT 0 CHECK (ga_count >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT promoter_gas_entries_pkey PRIMARY KEY (id),
  CONSTRAINT promoter_gas_entries_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.promoter_daily_reports(id),
  CONSTRAINT promoter_gas_entries_team_lead_id_fkey FOREIGN KEY (team_lead_id) REFERENCES public.promoter_team_leads(id)
);
CREATE TABLE public.promoter_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  team_lead_id uuid NOT NULL,
  promoter_name text NOT NULL,
  msisdn text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  dropped_at timestamp with time zone,
  CONSTRAINT promoter_members_pkey PRIMARY KEY (id),
  CONSTRAINT promoter_members_team_lead_id_fkey FOREIGN KEY (team_lead_id) REFERENCES public.promoter_team_leads(id)
);
CREATE TABLE public.promoter_team_leads (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  msisdn text NOT NULL UNIQUE,
  zone text NOT NULL,
  se_cluster text NOT NULL,
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT promoter_team_leads_pkey PRIMARY KEY (id)
);
CREATE TABLE public.regions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  code character varying NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT regions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.retailer_dump (
  RETAILER_MSISDN text NOT NULL,
  RETAILER_FIRST_NAME text,
  RETAILER_LAST_NAME text,
  CP_TYPE text,
  DSO text,
  SALES_APP_RETAILER_SITE_ID text,
  SITE_ID text,
  SITE_NAME text,
  TSE/SE text,
  ZSM text,
  ZBM text,
  ZONE text,
  CONSTRAINT retailer_dump_pkey PRIMARY KEY (RETAILER_MSISDN)
);
CREATE TABLE public.retailer_dump_full (
  RETAILER_MSISDN text NOT NULL,
  RETAILER_FIRST_NAME text,
  RETAILER_LAST_NAME text,
  CP_TYPE text,
  DSO text,
  SALES_APP_RETAILER_SITE_ID text,
  SITE_ID text,
  SITE_NAME text,
  TSE/SE text,
  ZSM text,
  ZBM text,
  ZONE text,
  MTD_GA text,
  Oct-25 text,
  Nov-25 text,
  Dec-25 text,
  Jan-26 text,
  CONSTRAINT retailer_dump_full_pkey PRIMARY KEY (RETAILER_MSISDN)
);
CREATE TABLE public.se_login_audit (
  id integer NOT NULL DEFAULT nextval('se_login_audit_id_seq'::regclass),
  se_id uuid,
  login_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  ip_address character varying,
  device_info text,
  status character varying CHECK (status::text = ANY (ARRAY['success'::character varying, 'failed'::character varying, 'locked'::character varying]::text[])),
  failure_reason text,
  CONSTRAINT se_login_audit_pkey PRIMARY KEY (id),
  CONSTRAINT se_login_audit_se_id_fkey FOREIGN KEY (se_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.service_request (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sr_number text,
  customer_name text,
  customer_phone text,
  town_id integer,
  estate text,
  package text,
  preferred_date date,
  preferred_time text,
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'assigned'::text, 'completed'::text, 'failed'::text, 'rescheduled'::text, 'unreachable'::text, 'not_ready'::text])),
  assigned_installer_id bigint,
  assigned_at timestamp with time zone,
  agent_name text,
  agent_phone text,
  remarks text,
  completed_at timestamp with time zone,
  rejection_count integer NOT NULL DEFAULT 0,
  rejected_by ARRAY NOT NULL DEFAULT '{}'::bigint[],
  escalated_at timestamp with time zone,
  allocation_attempted_at timestamp with time zone,
  allocation_attempt_id uuid,
  source_type text DEFAULT 'public'::text CHECK (source_type = ANY (ARRAY['dse'::text, 'public'::text, 'agent'::text])),
  source_id bigint,
  source_name text,
  location_accuracy numeric,
  CONSTRAINT service_request_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sitewise (
  SITE ID text NOT NULL,
  SITE text,
  TOWN CATEGORY text,
  CLUSTER (691) text,
  TSE text,
  ZSM text,
  ZBM text,
  ZONE text,
  zone text,
  CONSTRAINT sitewise_pkey PRIMARY KEY (SITE ID)
);
CREATE TABLE public.sitewise_lat_long (
  SITE ID text NOT NULL,
  SITE text,
  WARDS text,
  TOWN text,
  SUB-COUNTY text,
  COUNTY text,
  TOWN CATEGORY text,
  RURAL/URBAN CLASSIFICATION text,
  CLUSTER (691) text,
  TSE/SE text,
  ZSM text,
  ZBM text,
  ZONE text,
  DATE ON AIR text,
  Site Tech text,
  Project FY' 25 text,
  Focus Class CATEGORIZATION text,
  CATEGORY text,
  LATITUDE double precision,
  LONGITUDE double precision,
  POPULATION text,
  REC BASE text,
  CONSTRAINT sitewise_lat_long_pkey PRIMARY KEY (SITE ID)
);
CREATE TABLE public.social_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  author_role text,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT social_comments_pkey PRIMARY KEY (id),
  CONSTRAINT social_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.social_posts(id),
  CONSTRAINT social_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.social_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT social_likes_pkey PRIMARY KEY (id),
  CONSTRAINT social_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.social_posts(id),
  CONSTRAINT social_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.social_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid,
  author_name text NOT NULL,
  author_role text,
  author_zone text,
  content text NOT NULL,
  image_url text,
  likes integer DEFAULT 0,
  liked_by ARRAY DEFAULT '{}'::uuid[],
  comments jsonb DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  hall_of_fame boolean DEFAULT false,
  hashtags jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT social_posts_pkey PRIMARY KEY (id),
  CONSTRAINT social_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.streaks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_submission_date date,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT streaks_pkey PRIMARY KEY (id),
  CONSTRAINT streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.submissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  program_id uuid,
  user_id uuid NOT NULL,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending'::text,
  gps_location jsonb,
  photos ARRAY,
  points_awarded integer DEFAULT 0,
  reviewed_by text,
  review_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT submissions_pkey PRIMARY KEY (id),
  CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id),
  CONSTRAINT submissions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id)
);
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  region_id uuid,
  lead_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id),
  CONSTRAINT teams_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.upload_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  status text DEFAULT 'staged'::text CHECK (status = ANY (ARRAY['staged'::text, 'live'::text, 'rolled_back'::text])),
  total_users integer DEFAULT 0,
  warnings_count integer DEFAULT 0,
  uploaded_at timestamp with time zone DEFAULT now(),
  went_live_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT upload_batches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  earned_at timestamp with time zone DEFAULT now(),
  unlocked_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id),
  CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.user_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid,
  action_type character varying NOT NULL,
  action_details jsonb,
  performed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_actions_pkey PRIMARY KEY (id),
  CONSTRAINT user_actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id),
  CONSTRAINT user_actions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.user_sessions(id)
);
CREATE TABLE public.user_call_status (
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'offline'::text CHECK (status = ANY (ARRAY['online'::text, 'offline'::text, 'busy'::text, 'in_call'::text])),
  last_seen timestamp with time zone DEFAULT now(),
  current_call_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_call_status_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_call_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.user_challenges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL,
  current_count integer DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_challenges_pkey PRIMARY KEY (id),
  CONSTRAINT user_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.user_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_follows_pkey PRIMARY KEY (id),
  CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.app_users(id),
  CONSTRAINT user_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_start timestamp with time zone NOT NULL DEFAULT now(),
  session_end timestamp with time zone,
  device_type character varying,
  app_version character varying,
  ip_address character varying,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.van_calendar_conflicts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conflict_type text NOT NULL,
  conflict_date date NOT NULL,
  site_id bigint,
  site_name text,
  van1_id bigint,
  van1_numberplate text,
  zsm1_id uuid,
  zsm1_name text,
  van2_id bigint,
  van2_numberplate text,
  zsm2_id uuid,
  zsm2_name text,
  status text DEFAULT 'unresolved'::text CHECK (status = ANY (ARRAY['unresolved'::text, 'resolved'::text, 'ignored'::text])),
  resolved_by uuid,
  resolved_at timestamp with time zone,
  resolution_notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT van_calendar_conflicts_pkey PRIMARY KEY (id),
  CONSTRAINT van_calendar_conflicts_van1_id_fkey FOREIGN KEY (van1_id) REFERENCES public.van_db(id),
  CONSTRAINT van_calendar_conflicts_zsm1_id_fkey FOREIGN KEY (zsm1_id) REFERENCES public.app_users(id),
  CONSTRAINT van_calendar_conflicts_van2_id_fkey FOREIGN KEY (van2_id) REFERENCES public.van_db(id),
  CONSTRAINT van_calendar_conflicts_zsm2_id_fkey FOREIGN KEY (zsm2_id) REFERENCES public.app_users(id),
  CONSTRAINT van_calendar_conflicts_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.app_users(id)
);
CREATE TABLE public.van_calendar_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  van_id bigint NOT NULL,
  van_numberplate text NOT NULL,
  zsm_id uuid NOT NULL,
  zsm_name text NOT NULL,
  zsm_phone text NOT NULL,
  zsm_zone text NOT NULL,
  rest_day integer NOT NULL,
  daily_plans jsonb NOT NULL,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'cancelled'::text])),
  total_sites_planned integer NOT NULL DEFAULT 0,
  zones_covered ARRAY,
  compliance_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  submitted_at timestamp with time zone,
  CONSTRAINT van_calendar_plans_pkey PRIMARY KEY (id),
  CONSTRAINT van_calendar_plans_van_id_fkey FOREIGN KEY (van_id) REFERENCES public.van_db(id),
  CONSTRAINT van_calendar_plans_zsm_id_fkey FOREIGN KEY (zsm_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.van_db (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  number_plate text UNIQUE,
  capacity text,
  vendor text,
  zone text,
  zsm_county text,
  location_description text,
  van_name text,
  CONSTRAINT van_db_pkey PRIMARY KEY (id)
);
CREATE TABLE public.verification_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone_number text,
  code text NOT NULL,
  type text NOT NULL DEFAULT '2fa_setup'::text,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT verification_codes_pkey PRIMARY KEY (id),
  CONSTRAINT verification_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);

