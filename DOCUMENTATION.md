# Airtel Champions App Web — Technical Documentation

> **Audience:** Senior engineers, architects, and technical leads onboarding to this codebase.  
> **Last updated:** 2026-04-10  
> **Version:** 4.0.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [User Roles, Permissions & Workflows](#3-user-roles-permissions--workflows)
4. [Database Schema — Every Table Explained](#4-database-schema--every-table-explained)
5. [Major Features — Technical Deep-Dives](#5-major-features--technical-deep-dives)
6. [Third-Party Integrations](#6-third-party-integrations)
7. [Real-Time Systems](#7-real-time-systems)
8. [Security Model](#8-security-model)
9. [GPS Tracking & Job Allocation Scoring](#9-gps-tracking--job-allocation-scoring)
10. [Edge Function Catalogue](#10-edge-function-catalogue)
11. [Deployment Architecture](#11-deployment-architecture)

---

## 1. Executive Summary

### What It Is

**Airtel Champions App Web** is an enterprise Progressive Web App (PWA) built for Airtel Africa Kenya's field sales and Home Broadband (HBB) operations teams. It is a unified platform that combines:

- A **gamified sales engagement tool** for ~662 Sales Executives (SEs), their Zonal Sales Managers (ZSMs), Zonal Business Managers (ZBMs), and HQ Directors.
- A **full CRM and field operations system** for the Home Broadband (HBB) division, covering DSEs (Distribution Sales Executives), Agents, Installers, and HBB HQ supervisors.

### Who It Serves

| Persona | Count | Primary Purpose |
|---|---|---|
| Sales Executive (SE) | ~662 | Earn points, submit programs, view leaderboard |
| Zonal Sales Manager (ZSM) | ~20+ | Review zone performance, manage SEs |
| Zonal Business Manager (ZBM) | ~10 | Zone-level business reporting |
| HQ / Command Center | ~5 | System-wide visibility, announcements |
| Director | ~3 | Executive dashboard, message board |
| HBB Agent | ~100+ | Create service requests (leads) |
| HBB Installer | ~50+ | Accept, track, and complete broadband installs |
| HBB DSE | ~50+ | Create and track broadband leads |
| HBB HQ | ~5 | HBB operations oversight |
| Developer | Internal | Testing and debugging |

### Why It Exists

The app replaces fragmented spreadsheets, WhatsApp groups, and manual reporting with:
1. A **points and gamification engine** to motivate SE performance.
2. A **structured program submission workflow** (photographic evidence, GPS, form submissions).
3. A **live HBB service request CRM** with automated installer allocation, GPS tracking, and customer order visibility.
4. **Real-time communication tools** (group chat, WebRTC calling, announcements).

---

## 2. System Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  React 18 PWA  ·  TypeScript  ·  Vite  ·  Tailwind CSS          │
│  Zustand (state)  ·  Radix UI (components)  ·  Three.js (3D)    │
│  Capacitor (mobile APIs: camera, geolocation)                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS / WebSocket
┌────────────────────────────▼─────────────────────────────────────┐
│                    SUPABASE PLATFORM                             │
│                                                                  │
│  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────┐  │
│  │  Supabase Auth  │   │  Edge Functions  │   │  Realtime    │  │
│  │  (anon + RLS)   │   │  (Deno + Hono)   │   │  (WebSocket) │  │
│  └────────┬────────┘   └───────┬──────────┘   └──────┬───────┘  │
│           │                    │                      │          │
│  ┌────────▼────────────────────▼──────────────────────▼───────┐  │
│  │            PostgreSQL Database (Supabase)                   │  │
│  │  RLS-protected tables  ·  KV store tables                  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Frontend Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| TypeScript | Latest | Type safety |
| Vite | 6.3.5 | Build tool / dev server |
| Tailwind CSS | Latest | Utility-first styling |
| Zustand | 5.0.12 | Global state management |
| Radix UI | Various | Accessible headless components |
| React Hook Form | 7.55.0 | Form management |
| Zod | 3.x | Schema validation |
| Recharts | 2.15.2 | Data charts |
| Leaflet / React Leaflet | Latest | Maps |
| Three.js + React Three Fiber | 0.176.0 | 3D graphics (login cube) |
| Turf.js | 7.3.4 | Geospatial calculations |
| Sonner | 2.0.3 | Toast notifications |
| jsPDF | Latest | PDF generation |
| XLSX | Latest | Spreadsheet export |
| Capacitor | Latest | Mobile API bridge |
| Motion (Framer Motion) | Latest | Animations |

### Backend Stack

| Technology | Version | Purpose |
|---|---|---|
| Supabase | Latest | BaaS platform |
| PostgreSQL | Latest | Primary database |
| Deno | Latest | Edge function runtime |
| Hono | 4.x | HTTP router for edge functions |
| Supabase JS | 2.49.8 | DB client (frontend + server) |

### Supabase Projects

The application uses **two separate Supabase projects**:

| Project | URL | Used For |
|---|---|---|
| **Primary (Make)** | `mcbbtrrhqweypfnlzwht.supabase.co` | Edge function backend, server-side operations |
| **Frontend (App)** | `xspogpfohjmkykfjadhk.supabase.co` | Primary data store — all app_users, jobs, HBB tables |

> **Important:** The edge functions (`server/hbb.tsx`, etc.) are deployed to the Make project but query the Frontend project using a hardcoded anon key. This is because the Figma/Make preview iframe cannot directly access the Frontend Supabase project.

### Directory Structure

```
/
├── src/
│   ├── App.tsx                    # Root component — auth, routing, global state
│   ├── components/
│   │   ├── hbb/                   # HBB CRM subsystem (15+ components)
│   │   ├── calling/               # WebRTC calling system (5 components)
│   │   ├── programs/              # Program management (3 components)
│   │   ├── figma/                 # Figma-synced components
│   │   ├── ui/                    # Reusable Radix-based UI primitives
│   │   ├── AppState.ts            # Zustand store
│   │   └── [100+ feature components]
│   ├── hooks/                     # Custom React hooks (11 hooks)
│   ├── lib/                       # Core utilities and service layers
│   ├── utils/                     # Helpers (analytics, supabase client, etc.)
│   └── supabase/
│       ├── functions/server/      # 39 Deno/Hono edge function modules
│       └── migrations/            # 16 SQL migration files
├── dist/                          # Vite build output
├── .schema.sql                    # Full DB schema reference (100+ tables)
├── package.json
└── vercel.json                    # Vercel deployment config
```

---

## 3. User Roles, Permissions & Workflows

### Role Hierarchy

```
Director
  └── HQ Command Center
        └── ZBM (Zonal Business Manager)
              └── ZSM (Zonal Sales Manager)
                    └── SE (Sales Executive)

HBB HQ
  ├── HBB DSE
  ├── HBB Agent
  └── HBB Installer

Developer (cross-cutting internal role)
```

### Role: `sales_executive`

**Dashboard component:** `HomeScreen` (main home in `App.tsx`)

**Workflows:**
1. Log in with phone number + PIN.
2. View personal dashboard — points total, rank, streak.
3. Browse and submit to **Programs** (photographic evidence, GPS location, form fields).
4. View the **Leaderboard** — today's top performers, all-time ranking.
5. Complete **Daily Missions** and **Challenges** to earn bonus points.
6. Post to the **Social Feed** — images, text, hashtags, likes, comments.
7. Join and message in **Groups** (personal/official).
8. Make **WebRTC audio/video calls** to other users.
9. View and send messages to the **Director Message Board**.
10. Receive **Push Notifications** and in-app announcements.

**Screens accessible:** Home, Leaderboard, Missions, Badges, Programs, Social Feed, Explore Feed, Groups, Profile, Calls, Settings, Submissions History, Announcements.

---

### Role: `zonal_sales_manager` (ZSM)

**Dashboard component:** `ZoneCommanderDashboard`

**Additional workflows beyond SE:**
1. View all SEs under their zone.
2. Review SE submission performance by program.
3. Access the **ZSM Review Dashboard** for structured approvals.
4. Manage **Van Calendar** — schedule and assign vans to sites.
5. View reporting structure (org chart).

---

### Role: `zonal_business_manager` (ZBM)

**Dashboard component:** `ZoneBusinessLeadDashboard`

**Additional workflows:**
1. Cross-zone performance visibility.
2. Business analytics per zone and region.
3. Program analytics summary.

---

### Role: `hq_command_center`

**Dashboard component:** `HQDashboard`

**Additional workflows:**
1. Publish and manage **Announcements** (all-roles or role-targeted).
2. Approve or reject program **Submissions**.
3. Access all analytics — region-wide, zone-wide.
4. Manage van database (create, update, search vans).
5. View HQ Director management screen.
6. Access the **Activity Dashboard** (live user actions log).
7. Bulk-import users from XLSX.
8. Database schema checker and setup.

---

### Role: `director`

**Dashboard component:** `DirectorDashboard` or `DirectorDashboardV2`

**Additional workflows:**
1. View executive analytics.
2. Read and reply to **Director Messages** sent by SEs.
3. Mark messages as read/replied/archived.
4. React to messages with emoji reactions.
5. View director reporting structure.
6. Access Director Line hierarchy visualization.

---

### Role: `hbb_agent`

**Dashboard component:** `HBBAgentDashboard`

**Workflow:**
1. Log in with phone + PIN (authenticated against `agents_HBB` table).
2. Create **Service Requests** (leads) — customer name, phone, estate, package, preferred date.
3. View status of submitted leads in **My Leads**.
4. Track assigned installer's progress via **Client Order Tracker**.
5. Receive notifications when lead status changes.

---

### Role: `hbb_installer`

**Dashboard component:** `HBBInstallerDashboard`

**Workflow:**
1. Log in with phone + PIN (authenticated against `installers` table).
2. Receive new job assignment notifications.
3. Accept or reject assigned jobs.
4. Update job status: `pending → assigned → on_way → arrived → completed`.
5. Share GPS location during active jobs (written to `installer_locations` table).
6. Upload before/after photos of installations.
7. View **Installer Calendar** — schedule and upcoming jobs.
8. View job history and earnings summary.

**Rejection logic:** When an installer rejects a job, `recordRejectionAndReassign()` runs, appending `REJECTED_BY:{id}` to job remarks and triggering `unifiedAutoAssign()` for the next candidate. After 3 rejections the job escalates to `pending_escalation`.

---

### Role: `hbb_dse`

**Dashboard component:** `HBBDSEDashboard`

**Workflow:**
1. Log in with phone + PIN (authenticated against `DSE_14TOWNS` table).
2. Create service requests on behalf of customers.
3. View their leads pipeline.
4. Track installation progress for their submitted leads.

---

### Role: `hbb_hq`

**Dashboard component:** `HBBHQDashboard`

**Workflow:**
1. Log in with phone + PIN (authenticated against `HBB_HQ_TEAM` table).
2. Full view of all service requests across all agents/DSEs.
3. Manually assign or reassign installers.
4. View installer availability heatmap.
5. Trigger bulk auto-assignment.
6. Access HBB analytics dashboard.
7. Manage installer records (availability, daily caps).

---

### Role: `developer`

**Dashboard component:** `DeveloperDashboard` (enhanced version)

**Workflow:**
1. Access all dashboards via role switcher.
2. View debug information (user data, state).
3. Manage test users.
4. Toggle feature flags.
5. Access diagnostic panel.
6. Bypass restrictions for testing.

---

## 4. Database Schema — Every Table Explained

> Schema source: `.schema.sql` (reference only — not for direct execution).  
> Primary database: Frontend Supabase project (`xspogpfohjmkykfjadhk`).

### Core User & Auth Tables

#### `app_users`
The central user table for all non-HBB roles.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `employee_id` | varchar | Airtel employee ID |
| `full_name` | text NOT NULL | Display name |
| `email` | text | Optional |
| `phone_number` | varchar | Login credential |
| `role` | varchar | One of: `sales_executive`, `zsm`, `zbm`, `hq_command_center`, `director`, `developer` |
| `region` | text | Geographic region |
| `zone` | text | Sub-region zone |
| `zsm` | text | ZSM name for this user |
| `zbm` | text | ZBM name for this user |
| `rank` | int | Current leaderboard rank |
| `total_points` | int | Cumulative points earned |
| `pin` | text | Plain-text PIN (login credential — **do not expose**) |
| `pin_hash` | text | Base64 encoded pin (legacy) |
| `is_active` | bool | Account active flag |
| `is_locked` | bool | Locked after failed attempts |
| `failed_attempts` | int | Failed login counter |
| `login_count` | int | Total login count |
| `last_login_at` | timestamp | Last login time |
| `two_factor_enabled` | bool | 2FA flag |
| `gps_tracking_consent` | bool | Location tracking consent |
| `avatar_url` | text | Profile picture URL |
| `banner_url` | text | Profile banner URL |
| `bio` | text | User bio |
| `job_title` | text | Job title |
| `source_table` | text | Origin table (default: `app_users`) |

**Business purpose:** Single source of truth for all SE/ZSM/ZBM/HQ/Director identity and gamification data.

---

#### `app_users_staging`
Mirror of `app_users` used for bulk import staging. Rows are previewed here before being promoted to `app_users` via `upload_batches`.

---

#### `hq_directors`
Separate table for HQ and Director users.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `full_name` | text NOT NULL | |
| `phone_number` | text NOT NULL UNIQUE | Login credential |
| `role` | text | `HQ` or `Director` |
| `job_title` | text | |
| `region` | text | |
| `is_active` | bool | |
| `pin` | text | Login PIN |

**Business purpose:** Keeps HQ/Director accounts separate from field-force accounts for security segmentation.

---

#### `agents_HBB`
HBB Agents who submit broadband service requests.

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | Auto-increment |
| `Agent Name` | text | |
| `Agent Mobile Number` | bigint UNIQUE | Login credential |
| `Agent Type` | text | Default: `DSE` |
| `pin` | text | Default: `1234` |

---

#### `DSE_14TOWNS`
HBB DSE staff mapped to specific towns and estates.

| Column | Type | Notes |
|---|---|---|
| `ID` | bigint PK | |
| `Site ID` | text | Network site reference |
| `Site Name` | text | |
| `Town` | text | Town assignment |
| `DSE Name` | text | |
| `Estate Name` | text | Service estate |
| `WARD`, `WARD ID` | text | Administrative ward |
| `Phone` | text | Login credential |
| `pin` | text | Login PIN |

---

#### `HBB_HQ_TEAM`
HBB HQ supervisors with system-wide access.

| Column | Type | Notes |
|---|---|---|
| `ID` | bigint PK | |
| `NAME` | text | |
| `PHONE` | bigint | Login credential |
| `ROLE` | text | |
| `pin` | numeric | Default: `1234` |

---

### Installer & Job Tables

#### `installers`
**Unified installer table** (created by migration `20260410_merge_hbb_tables.sql`). Consolidates `installers_HBB` and `INHOUSE_INSTALLER_6TOWNS_MARCH`.

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `name` | text NOT NULL | |
| `phone` | text NOT NULL | Normalized to `0XXXXXXXXX` format |
| `town` | text | Town of operation |
| `estate` | text | Service estate/area |
| `lat`, `lng` | double | Installer base location |
| `status` | text | `available` / `busy` |
| `max_jobs_per_day` | int | Default: 6 |
| `pin` | text | Login PIN |
| `is_available` | bool | Real-time availability flag |
| `current_job_id` | uuid | FK → jobs(id) |
| `source_table` | text | Migration origin (`INHOUSE_INSTALLER_6TOWNS_MARCH` or `installers_HBB`) |
| `legacy_id` | bigint | Original PK from source table |

---

#### `INHOUSE_INSTALLER_6TOWNS_MARCH`
Legacy in-house installer table (still referenced by FK constraints from location tracking tables). Now read-only; new writes go to `installers`.

Key columns: `ID`, `Installer name`, `Installer contact`, `Estate Name`, `Town`, `Zone`, `PIN`, `is_available`, `last_known_lat`, `last_known_lng`, `current_job_id`, `max_jobs_per_day`, `daily_job_count`.

---

#### `installers_HBB`
Legacy HBB installer table (pre-migration). Contains: `id`, `name`, `phone`, `pin`, `town_id`, `status`, `max_jobs_per_day`. Still in place due to FK constraints; new code writes to `installers`.

---

#### `installers_availability`
Tracks real-time availability for INHOUSE_INSTALLER installers separately from their master record.

| Column | Type | Notes |
|---|---|---|
| `installer_id` | bigint PK | FK → INHOUSE_INSTALLER_6TOWNS_MARCH |
| `is_available` | bool | |
| `current_job_id` | uuid | FK → jobs |
| `daily_job_count` | int | Jobs completed today |
| `updated_at` | timestamptz | |

---

#### `jobs`
**Central service request / job table.** All broadband installation leads flow through here.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `sr_number` | bigint | Service Request number |
| `customer_phone` | text NOT NULL | |
| `customer_name` | text | |
| `town` | text | |
| `estate_name` | text NOT NULL | Key for installer matching |
| `status` | text | `pending`, `assigned`, `on_way`, `arrived`, `completed`, `cancelled`, `scheduled`, `pending_escalation`, `pending_reassignment`, `open`, `failed`, `rescheduled`, `unreachable`, `not_ready` |
| `installer_id` | bigint | FK → installers |
| `requested_at` | timestamptz | |
| `assigned_at` | timestamptz | When installer was assigned |
| `on_way_at`, `arrived_at`, `completed_at` | timestamptz | Status timestamps |
| `before_photo_url`, `after_photo_url` | text | Installation evidence |
| `customer_lat`, `customer_lng` | double | Customer location |
| `package` | text | Broadband package selected |
| `scheduled_date`, `scheduled_time` | text | Appointment slot |
| `zone` | text | |
| `source_type` | text | `dse`, `public`, `agent` |
| `source_id`, `source_name` | | Who created the lead |
| `agent_name`, `agent_phone` | text | Creating agent details |
| `remarks` | text | Free-text notes; **rejection history encoded here** as `REJECTED_BY:{id}` markers |
| `rejected_by` | bigint[] | Array of installer IDs who rejected |
| `completion_lat`, `completion_lng` | double | GPS at job completion |
| `legacy_sr_id` | bigint | FK → service_request(id) for migrated rows |

---

#### `service_request`
Legacy service request table (pre-migration `20260410`). Rows have been migrated to `jobs`. Still in place for historical data. Structure mirrors `jobs` but uses `bigint` identity PK and `estate` instead of `estate_name`.

---

#### `installer_locations`
Real-time GPS breadcrumb trail for active installations.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `installer_id` | bigint | FK → INHOUSE_INSTALLER_6TOWNS_MARCH |
| `job_id` | uuid | FK → jobs |
| `lat`, `lng` | double | GPS coordinate |
| `accuracy` | double | Accuracy in meters |
| `recorded_at` | timestamptz | |

**Partitioned by week:** `installer_locations_2026_w13`, `installer_locations_2026_w14` — allows efficient querying and archiving.

---

#### `installer_locations_archive`
Older location records moved from `installer_locations` for archival. No `job_id` column — earlier schema before job tracking.

---

#### `location_tracking`
Alternative location tracking table (may be used by different parts of the system).

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `job_id` | uuid | FK → jobs |
| `installer_id` | text | |
| `latitude`, `longitude` | numeric | |
| `accuracy_m` | numeric | |
| `recorded_at` | timestamptz | |

---

#### `installer_notifications`
In-app notifications for installers about new job assignments or status changes.

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `installer_id` | text | |
| `job_id` | uuid | FK → jobs |
| `type` | text | Default: `new_job` |
| `title` | text | |
| `body` | text | Notification body |
| `is_read` | bool | |
| `created_at` | timestamptz | |

---

#### `job_issues`
Customer-reported issues associated with a completed job.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `job_id` | uuid | FK → jobs |
| `customer_phone` | text | |
| `issue_type` | text | |
| `description` | text | |
| `status` | text | `open`, `in_progress`, `resolved`, `closed` |
| `resolution_notes` | text | |

---

#### `job_reviews`
Customer satisfaction ratings (1–5) for completed installations.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `job_id` | uuid | FK → jobs |
| `installer_id` | bigint | FK → INHOUSE_INSTALLER_6TOWNS_MARCH |
| `customer_phone` | text | |
| `rating` | int | 1–5 |
| `comment` | text | |

---

### Programs & Submissions

#### `programs`
Defines each sales activity/challenge SEs can submit to.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `title` | text NOT NULL | |
| `description` | text | |
| `icon`, `color` | text | UI display |
| `points_value` | int | Points awarded per approved submission |
| `target_roles` | text[] | Which roles can submit (default: `['sales_executive']`) |
| `category` | text | e.g., "Network Experience" |
| `status` | text | `active`, `draft`, `inactive` |
| `start_date`, `end_date` | timestamptz | Program window |
| `created_by` | uuid | FK → app_users |
| `who_can_submit` | text[] | Alias for target_roles |
| `points_enabled` | bool | Whether points are awarded |
| `system_id` | text UNIQUE | Machine-readable ID |
| `gps_auto_detect_enabled` | bool | Auto-capture GPS on submission |
| `zone_filtering_enabled` | bool | Restrict to specific zones |
| `progressive_disclosure_enabled` | bool | Reveal form sections progressively |
| `van_checkout_enforcement_enabled` | bool | Require van checked out before submit |
| `linked_checkin_program_id` | text | Link to a check-in program |
| `session_checkin_enabled` | bool | Require check-in session |

---

#### `program_fields`
Dynamic form fields for each program. Programs are fully configurable without code changes.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `program_id` | uuid | FK → programs |
| `field_name` | text NOT NULL | Internal name |
| `field_label` | text NOT NULL | Display label |
| `field_type` | text | `text`, `number`, `select`, `photo`, `gps`, etc. |
| `is_required` | bool | |
| `options` | jsonb | For select fields |
| `validation` | jsonb | Min/max, regex, etc. |
| `conditional_logic` | jsonb | Show/hide based on other field values |
| `order_index` | int | Field order |
| `section_id`, `section_title`, `section_index` | | Multi-section grouping |

---

#### `program_folders`
Organizes programs into folders for the folder-view UI.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text NOT NULL | |
| `icon` | text | Emoji |
| `color` | text | Hex color |
| `order_index` | int | |

---

#### `submissions`
Each time a user submits a program form.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `program_id` | uuid | FK → programs |
| `user_id` | uuid NOT NULL | FK → app_users |
| `responses` | jsonb | All form field answers |
| `status` | text | `pending`, `approved`, `rejected` |
| `gps_location` | jsonb | `{lat, lng, accuracy}` |
| `photos` | text[] | Upload URLs |
| `points_awarded` | int | Points given on approval |
| `reviewed_by` | text | Reviewer name/ID |
| `review_notes` | text | Rejection reason or notes |

---

#### `program_analytics`
Aggregate stats per program, maintained by triggers or server-side updates.

Columns: `total_submissions`, `approved_submissions`, `rejected_submissions`, `pending_submissions`, `total_points_awarded`, `unique_submitters`, `avg_submissions_per_user`, `completion_rate`.

---

#### `program_daily_trends`
Per-day submission counts per program for trend charting.

---

#### `program_top_performers`
Cached leaderboard per program — top submitters with their total points.

---

### Gamification Tables

#### `achievements`
Achievement definitions (unlockable badges).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | varchar NOT NULL UNIQUE | |
| `description` | text | |
| `icon` | varchar | |
| `points_required` | int | Threshold to unlock |
| `tier` | varchar | Bronze, Silver, Gold, etc. |

---

#### `user_achievements`
Records which achievements each user has earned.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK → app_users |
| `achievement_id` | uuid | FK → achievements |
| `earned_at`, `unlocked_at` | timestamptz | |

---

#### `challenges`
Time-bounded challenges tied to mission types.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `title` | varchar NOT NULL | |
| `mission_type_id` | uuid | FK → mission_types |
| `target_count` | int NOT NULL | How many actions to complete |
| `bonus_points` | int | Extra points for completion |
| `start_date`, `end_date` | timestamptz | |
| `is_active` | bool | |

---

#### `user_challenges`
Tracks each user's progress on challenges.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK → app_users |
| `challenge_id` | uuid | FK → challenges |
| `current_count` | int | Progress counter |
| `completed` | bool | |
| `completed_at` | timestamptz | |

---

#### `mission_types`
Categories of missions (e.g., "Photo Submission", "Retailer Visit").

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | varchar NOT NULL UNIQUE | |
| `base_points`, `points` | int | Point values |
| `category`, `icon`, `color` | | Display |
| `is_active` | bool | |

---

#### `point_config`
Multiplier rules per mission type for special conditions.

| Column | Type | Notes |
|---|---|---|
| `mission_type_id` | uuid | FK → mission_types |
| `base_points` | int | |
| `hotspot_multiplier` | numeric | Default: 1.5× at hotspot sites |
| `weekend_multiplier` | numeric | Default: 1.2× on weekends |
| `early_bird_multiplier` | numeric | Default: 1.1× for early submissions |

---

#### `points_history`
Audit trail of every point transaction.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | FK → app_users |
| `points` | int | Points in this transaction |
| `source` | text | e.g., `submission`, `challenge` |
| `source_id` | uuid | Reference to source record |
| `description` | text | Human-readable reason |

---

#### `streaks`
Daily submission streak tracking per user.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid PK | FK → app_users |
| `current_streak` | int | Days active in a row |
| `longest_streak` | int | All-time best streak |
| `last_submission_date` | date | |

---

### Social & Communication Tables

#### `social_posts`
User-created posts in the social feed.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `author_id` | uuid | FK → app_users |
| `author_name`, `author_role`, `author_zone` | text | Denormalized for display speed |
| `content` | text NOT NULL | Post text |
| `image_url` | text | Single image URL |
| `likes`, `likes_count` | int | Like count (dual columns, being consolidated) |
| `liked_by` | uuid[] | Array of users who liked |
| `comments` | jsonb | Embedded comment list (legacy) |
| `comments_count` | int | |
| `hashtags` | jsonb | Extracted hashtag list |
| `hall_of_fame` | bool | Pinned to Hall of Fame |
| `is_published` | bool | |

---

#### `social_comments`
Normalized comments (preferred over embedded `social_posts.comments`).

| Column | Type | Notes |
|---|---|---|
| `post_id` | uuid | FK → social_posts |
| `author_id` | uuid | FK → app_users |
| `author_name`, `author_role` | text | |
| `content` | text NOT NULL | |

---

#### `social_likes`
Normalized like records for deduplication.

---

#### `hashtags`
Trending hashtag tracking.

| Column | Type | Notes |
|---|---|---|
| `tag` | text UNIQUE | |
| `post_count` | int | |
| `first_used_at`, `last_used_at` | timestamptz | |

---

#### `groups`
Group definitions for the group messaging feature.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | varchar NOT NULL | |
| `description` | text | |
| `icon` | varchar | Emoji |
| `type` | varchar | `personal` or `official` |
| `created_by` | uuid | FK → app_users |

---

#### `group_members`
Membership records per group.

| Column | Type | Notes |
|---|---|---|
| `group_id` | uuid | FK → groups |
| `user_id` | uuid | FK → app_users |
| `role` | varchar | `admin` or `member` |
| `joined_at` | timestamptz | |

---

#### `group_messages`
Messages sent within groups.

| Column | Type | Notes |
|---|---|---|
| `group_id` | uuid | FK → groups |
| `user_id` | uuid | FK → app_users |
| `message` | text | |
| `photos` | text[] | Image attachments |

---

#### `director_messages`
Messages sent to the Director through the message board feature.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `sender_id` | uuid | FK → app_users |
| `sender_name`, `sender_role`, `sender_zone` | text | |
| `message` | text NOT NULL | |
| `category` | text | |
| `is_anonymous` | bool | Sender anonymity option |
| `status` | text | `unread`, `read`, `replied`, `archived` |
| `is_public` | bool | Visible to all or private |
| `priority` | text | `low`, `normal`, `high`, `urgent` |
| `reply_to` | uuid | FK → director_messages (threaded replies) |
| `director_reaction` | text | Emoji reaction from director |
| `ashish_reply` | text | Named director's reply text |
| `ashish_reply_time` | timestamptz | |
| `visible_to` | jsonb | Role array for visibility |

---

### Calling / WebRTC Tables

#### `call_sessions`
Records every call attempt.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `caller_id`, `callee_id` | uuid | FK → app_users |
| `status` | text | `ringing`, `active`, `ended`, `missed`, `rejected`, `failed` |
| `call_type` | text | `audio` or `video` |
| `started_at`, `answered_at`, `ended_at` | timestamptz | |
| `duration_seconds` | int | |
| `ended_reason` | text | |

---

#### `call_signals`
WebRTC signaling exchange records (offer, answer, ICE candidates).

| Column | Type | Notes |
|---|---|---|
| `call_session_id` | uuid | FK → call_sessions |
| `from_user_id`, `to_user_id` | uuid | FK → app_users |
| `signal_type` | text | `offer`, `answer`, `ice_candidate`, `hang_up` |
| `signal_data` | jsonb | WebRTC signal payload |
| `read` | bool | Whether receiver has processed |

---

#### `user_call_status`
Real-time presence table for calling system.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid PK | FK → app_users |
| `status` | text | `online`, `offline`, `busy`, `in_call` |
| `last_seen` | timestamptz | |
| `current_call_id` | uuid | Active call reference |

---

### Analytics & Audit Tables

#### `activity_logs`
Every significant user action logged here.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | text NOT NULL | |
| `user_name`, `user_role` | text | |
| `action` | text NOT NULL | Action type string |
| `metadata` | jsonb | Action-specific context |
| `session_id` | text | |
| `device_info` | jsonb | Browser/device details |

---

#### `user_sessions`
Login session records.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK → app_users |
| `session_start`, `session_end` | timestamptz | |
| `device_type` | varchar | |
| `app_version` | varchar | |
| `ip_address` | varchar | |
| `user_agent` | text | |

---

#### `user_actions`
Fine-grained user action events within sessions.

---

#### `page_views`
Page/screen view tracking per session.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | FK → app_users |
| `session_id` | uuid | FK → user_sessions |
| `page_name` | varchar | |
| `time_spent_seconds` | int | |

---

#### `se_login_audit`
Login attempt audit specifically for SEs.

| Column | Type | Notes |
|---|---|---|
| `se_id` | uuid | FK → app_users |
| `login_time` | timestamp | |
| `ip_address` | varchar | |
| `status` | varchar | `success`, `failed`, `locked` |
| `failure_reason` | text | |

---

#### `password_changes`
Audit trail of PIN/password changes.

---

#### `org_change_log`
Organizational structure changes (role changes, zone transfers, new/removed users).

| Column | Type | Notes |
|---|---|---|
| `change_batch_id` | uuid | FK → upload_batches |
| `phone_number`, `user_name` | text | |
| `change_type` | text | `new_user`, `removed_user`, `role_change`, `zone_transfer` |
| `old_value`, `new_value` | jsonb | Before/after state |
| `effective_date` | timestamptz | |

---

#### `upload_batches`
Tracks bulk user import operations.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `filename` | text | |
| `status` | text | `staged`, `live`, `rolled_back` |
| `total_users` | int | |
| `warnings_count` | int | |
| `went_live_at` | timestamptz | |

---

#### `phone_change_requests`
Workflow for users requesting phone number changes (requires approval).

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | FK → app_users |
| `current_phone`, `requested_phone` | text | |
| `status` | text | `pending`, `approved`, `rejected` |
| `approver_role` | text | Who must approve |
| `approved_by` | uuid | Approver user ID |
| `rejection_reason` | text | |

---

### Van Management Tables

#### `van_db`
Master van inventory.

Columns: `number_plate`, `vendor`, `zone`, `category`, `capacity`, `status`.

---

#### `Partner_vans`
Partner-owned vans with monthly performance data.

Columns: `Van Reg`, `Partner Name`, `Van capacity`, `ZSM`, `Zone`, `Category`, monthly columns (JUNE through MTD).

---

#### `van_calendar_conflicts`
Records when two vans are scheduled to the same site on the same date.

---

### Geographic / Reference Tables

#### `NEW_SITES_MARCH`
Network tower site data with GPS coordinates.

| Column | Type | Notes |
|---|---|---|
| `SITE ID` | text | |
| `SITE NAME` | text | |
| `Latitude`, `Longitude` | double | GPS location |
| `WARD_NAME`, `SUBCOUNTY`, `COUNTY` | text | Administrative hierarchy |
| `Town Cat` | text | Town category |
| `CLUSTER` | text | Network cluster |
| `TSE`, `ZSM`, `ZONE` | text | Assignment hierarchy |

---

#### `sitewise` / `sitewise_lat_long`
Additional site reference tables with extended geographic and operational metadata.

---

#### `SE_MARCH` / `ZSM_MARCH`
Reference tables for SE and ZSM territory assignments. Used for org chart and reporting structure.

---

#### `estate_neighbours`
Geographic proximity data between housing estates (used for installer search radius expansion).

| Column | Type | Notes |
|---|---|---|
| `estate_name`, `neighbour_name` | text PK | |
| `town` | text | |
| `priority` | int | Lower = closer/better |
| `distance_km` | int | |
| `walking_mins` | int | |

---

#### `Retailer_dump_3rd_march` / `retailer_dump` / `retailer_dump_full`
Retailer data dumps imported from Airtel's retail system. Used for reference lookups and reporting.

Columns: `RETAILER_MSISDN`, `RETAILER_FIRST_NAME/LAST_NAME`, `CP_TYPE`, `DSO`, `SITE_ID`, `SITE_NAME`, `TSE/SE`, `ZSM`, `ZBM`, `ZONE`, monthly GA data.

---

#### `SD_DASHBOARD`
Distributor/partner dashboard reference data with targets.

---

#### `amb_shops` / `amb_sitewise`
AMB (Airtel Money Business) shop status tracking and site-to-shop mapping.

---

#### `regions` / `teams` / `departments`
Organizational hierarchy reference tables.

---

### System Tables

#### `app_versions`
App version management for the update manager.

| Column | Type | Notes |
|---|---|---|
| `version` | varchar NOT NULL | Semantic version string |
| `bundle_url` | text NOT NULL | Download URL for app bundle |
| `release_notes` | text | |
| `is_mandatory` | bool | Force update flag |
| `platform` | varchar | Default: `android` |

---

#### `notifications`
General notification records for in-app notification bell.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | FK → app_users (null = broadcast) |
| `recipient_role` | text | Role-based broadcast |
| `type` | text | Notification type |
| `title`, `message` | text | |
| `read`, `is_read` | bool | (dual columns, legacy) |
| `data` | jsonb | Extra context |

---

#### `kv_store_*` Tables
Four KV store tables (suffixed with project UUIDs) used by edge functions for:
- Van checkout enforcement
- Rate limiting counters
- Session tokens
- Group message caching
- Announcement storage

Each has: `key text PK`, `value jsonb`, optional `created_at`/`updated_at`.

---

#### `_inst_id`
Internal table storing a single installer ID value (utility table used during assignments).

---

## 5. Major Features — Technical Deep-Dives

### 5.1 Authentication System

**Flow:**
```
LoginScreen
  → User enters phone number + 4-digit PIN
  → Client queries app_users WHERE phone_number = ? AND pin = ?
     OR hq_directors WHERE phone_number = ? AND pin = ?
     OR agents_HBB WHERE "Agent Mobile Number" = ?
     OR installers WHERE phone = ? AND pin = ?
     OR DSE_14TOWNS WHERE Phone = ?
     OR INHOUSE_INSTALLER_6TOWNS_MARCH WHERE "Installer contact" = ?
  → On match: setUser(), setUserData(), initActivityTracking()
  → sanitizeUserForStorage() removes pin/pin_hash before localStorage
  → Persist sanitized user to localStorage for session resumption
  → Activity logged to activity_logs + user_sessions
```

**Security notes:**
- PINs are stored in plain text in the database (technical debt — should be hashed).
- `sanitizeUserForStorage()` ensures PINs never touch localStorage.
- Account locking after failed attempts: `is_locked` flag + `failed_attempts` counter.
- Optional 2FA: `two_factor_enabled` flag triggers `TwoFactorModal`.

**Session resumption:**
On app load, `localStorage` is checked for a serialized user object. If found and valid, the user is automatically restored without re-authentication.

---

### 5.2 Programs & Submissions Engine

Programs are fully configurable without code changes. Each program has:
- A **dynamic form** built from `program_fields` records.
- **Conditional logic** for showing/hiding fields based on other answers.
- **Multi-section layout** for complex forms.
- Optional **GPS capture** (`gps_auto_detect_enabled`).
- Optional **van checkout enforcement** — checks KV store for an active checkout before allowing submission.
- Optional **zone filtering** — restricts submissions to SEs in specific zones.

**Submission flow:**
```
User opens Program → Dynamic form renders from program_fields
  → User fills form, camera captures photos → Submits
  → POST /api/submissions with {program_id, responses, gps_location, photos}
  → Server validates, inserts into submissions (status: 'pending')
  → program_analytics updated (total_submissions++)
  → Points awarded only on HQ approval (status: 'approved')
  → app_users.total_points updated on approval
  → points_history record created
  → streaks updated
```

**Folder organization:** Programs can be organized into `program_folders` and displayed in a folder-tree UI (`programs-list-folders-app.tsx`).

---

### 5.3 Gamification Engine

**Points calculation:**
- Base points come from `programs.points_value`.
- Multipliers from `point_config`:
  - Hotspot sites: 1.5×
  - Weekend: 1.2×
  - Early bird: 1.1×
- All multipliers can stack.

**Leaderboard:**
- `app_users.total_points` is the ranking field.
- `app_users.rank` stores current rank (integer).
- Leaderboard queries: `SELECT * FROM app_users ORDER BY total_points DESC`.
- Today's leaderboard: filter `submissions` by `created_at >= today` and sum `points_awarded`.

**Achievements:**
- Defined in `achievements` table with `points_required` thresholds.
- Server checks on each points update whether new achievements are unlocked.
- `user_achievements` records unlock events.

**Streaks:**
- `streaks.current_streak` increments on each day with at least one submission.
- Resets to 0 if a day is missed.
- `longest_streak` is a watermark that never decreases.

**Daily Challenges:**
- `challenges` define a target count and mission type.
- `user_challenges` tracks each user's progress.
- On challenge completion, `bonus_points` are awarded.

---

### 5.4 HBB CRM System

This is a complete field operations system for Airtel's Home Broadband division.

**Key components:**
- `hbb-agent-dashboard.tsx` — Agent creates leads.
- `hbb-dse-dashboard.tsx` — DSE creates leads and tracks territory.
- `hbb-installer-dashboard.tsx` — Installer views assigned jobs and updates status.
- `hbb-hq-dashboard.tsx` — HQ views all operations.
- `ClientOrderTracker.tsx` — Customer-facing order tracking view.
- `hbb-api.ts` — Client API wrapper calling edge function endpoints.

**Service request lifecycle:**
```
Agent/DSE creates job (POST /hbb/service-requests)
  → status: 'pending'
  → Auto-assign engine runs (unifiedAutoAssign)
  → status: 'assigned', installer_id set
  → Installer accepts → status: 'on_way'
  → Installer arrives → status: 'arrived'
  → GPS location logged to installer_locations
  → Installation complete → before/after photos uploaded
  → status: 'completed', completed_at set
```

**Rejection loop:**
```
Installer rejects job
  → recordRejectionAndReassign()
  → 'REJECTED_BY:{id}' appended to remarks
  → installer freed (is_available = true)
  → unifiedAutoAssign() runs again on next candidate
  → After 3 rejections: status = 'pending_escalation'
  → HQ manually assigns
```

---

### 5.5 Job Auto-Assignment Algorithm

See [Section 9](#9-gps-tracking--job-allocation-scoring) for full algorithm detail.

---

### 5.6 WebRTC Calling System

**Architecture:**
- Signaling via Supabase Realtime (WebSocket channel per call session).
- `call_sessions` records the call state machine.
- `call_signals` stores SDP offer/answer and ICE candidates.
- `user_call_status` provides presence (online/offline/busy/in_call).

**Call flow:**
```
Caller selects user from UserDirectory
  → Creates call_session (status: 'ringing')
  → Creates SDP offer in call_signals
  → Callee's useWebRTC hook detects new call_signal via Realtime
  → IncomingCallModal shows
  → Callee answers: creates SDP answer in call_signals
  → ICE candidates exchanged via call_signals
  → WebRTC peer connection established
  → call_session status → 'active', answered_at set
  → Either party hangs up: 'hang_up' signal sent
  → call_session status → 'ended', duration_seconds calculated
```

**Hooks:**
- `useWebRTC.tsx` — handles entire WebRTC lifecycle.
- Components: `ActiveCallScreen`, `IncomingCallModal`, `CallHistory`, `UserDirectory`, `PermissionRequestModal`.

---

### 5.7 Social Feed

**Post creation:**
```
POST /api/social
  → hashtag extraction (regex match on #word patterns)
  → hashtags table upserted (post_count++)
  → social_posts inserted
  → Optional: image_url stored (Supabase storage upload)
```

**Trending algorithm (server/social.tsx):**
Post scores calculated as:
```
score = (likes_count × 3) + (comments_count × 2) + (recency_factor)
recency_factor = age_hours < 24 ? 1.5 : age_hours < 72 ? 1.2 : 1.0
```

**Hall of Fame:** Posts with `hall_of_fame = true` appear in a curated top section.

---

### 5.8 Group Chat

**Architecture:** Hybrid KV-store + database approach.
- `groups` and `group_members` in PostgreSQL.
- `group_messages` in PostgreSQL for persistence.
- Latest messages cached in KV store by prefix `group_msg:{group_id}` for fast retrieval.

**Group types:**
- `personal` — Created by any user for informal communication.
- `official` — Created by HQ/Directors for formal channels.

---

### 5.9 Van Calendar System

**Purpose:** Schedule which sales van visits which network site on which date, tracking compliance and avoiding conflicts.

**Components:**
- `van-calendar-view.tsx` — Monthly calendar grid.
- `van-calendar-form.tsx` — Schedule a van to a site.
- `van-calendar-compliance.tsx` — Compliance tracking.
- `van-calendar-zsm-checklist.tsx` — ZSM sign-off workflow.
- `van-calendar-widget-hq.tsx` — HQ summary widget.

**Conflict detection:** `van_calendar_conflicts` table stores any case where a van is double-booked or two vans are scheduled to the same site.

**Van checkout enforcement:** If a program has `van_checkout_enforcement_enabled = true`, the KV store is checked for `van_checkout:{user_id}` before allowing submission. The SE must have checked out a van via the van calendar first.

---

### 5.10 Announcements System

**Creation:** HQ/Director role only (enforced server-side).
**Targeting:** `target_roles` field allows broadcasting to specific roles.
**Storage:** Announcements stored in KV store (fast reads) and optionally in PostgreSQL.
**Delivery:** In-app notification bell + full announcements modal.

---

### 5.11 Director Message Board

SEs can send messages (anonymously or named) to the Director.
- Anonymous messages: `is_anonymous = true`, `actual_sender_id` stored separately from `sender_id` (which may be null).
- Director can react with emoji, reply with text.
- Replies are threaded via `reply_to` FK.
- Messages can be marked public (`is_public = true`) for all to see.
- Priority system: `low`, `normal`, `high`, `urgent`.

---

### 5.12 PWA Features

- **Service Worker:** Managed by `vite-plugin-pwa` with Workbox.
- **Dynamic Manifest:** Generated in `App.tsx` with icons, shortcuts, and protocol handlers.
- **App Shortcuts:**
  - `web+airtelac://tab/leaderboard`
  - `web+airtelac://tab/programs`
  - `web+airtelac://tab/feed`
  - `web+airtelac://tab/profile`
- **Offline Support:** `OfflineManager` queues writes when offline and syncs when connection is restored.
- **Push Notifications:** Web Push API via `usePushNotifications` hook + `push-notifications.tsx` edge function.
- **App Badging API:** `useBadge` hook shows unread notification count on app icon.
- **Wake Lock:** `useWakeLock` prevents screen sleep during active use (e.g., installer tracking jobs).
- **Update Manager:** `update-manager.tsx` polls `app_versions` table, prompts user to update if a newer version is available. `is_mandatory` forces immediate update.

---

### 5.13 3D Login Screen

The login page features a rotating 3D Rubik's Cube rendered with Three.js and React Three Fiber. The cube serves as a **mode selector**: each face represents a login mode (Sales Executive, HBB roles). Users interact with the cube to select their role domain before entering credentials.

**Components:**
- `RubiksCube.tsx` — Three.js cube with interactive rotation.
- `LoginPage.tsx` — Wrapper with mode state management.
- `LoginScreen.tsx` — Traditional login form (phone + PIN).

---

## 6. Third-Party Integrations

### Supabase
- **Role:** Primary BaaS platform — database, auth, realtime, storage, edge functions.
- **Two projects:** Make project (backend functions) and Frontend project (data).
- **Realtime channels:** Used for WebRTC signaling and live location updates.
- **Storage:** Supabase Storage buckets for user photos, submission images, installation photos.

### Capacitor
- **Role:** Mobile API bridge for native device features.
- **Plugins used:**
  - `@capacitor/camera` — Photo capture for submissions and profiles.
  - `@capacitor/geolocation` — GPS location for submissions and installer tracking.
  - `@capacitor/app` — App lifecycle events.
  - `@capgo/capacitor-updater` — OTA (over-the-air) app updates.

### Turf.js
- **Role:** Geospatial calculations.
- **Used in:** `hbb-auto-assign.ts` for distance calculations between installer and job location.
- **Fallback:** Inline Haversine formula if Turf.js is unavailable.

### Three.js / React Three Fiber
- **Role:** 3D rendering.
- **Used for:** Login page Rubik's Cube mode selector.

### Leaflet / React Leaflet
- **Role:** Interactive maps.
- **Used in:** `BattleMap.tsx` for visualizing site/installer locations.

### Recharts
- **Role:** Data visualization charts.
- **Used in:** Analytics dashboards, deployment analysis, program performance charts.

### jsPDF / jsPDF-autotable
- **Role:** Client-side PDF generation.
- **Used for:** Report export, submission summaries.

### XLSX
- **Role:** Spreadsheet parsing and generation.
- **Used in:** `hbb-bulk-import.tsx` (import jobs from Excel), `user-upload-manager.tsx` (bulk user import from XLSX), report exports.

### Hono
- **Role:** HTTP router framework for Deno edge functions.
- **Used in:** All 39 edge function modules.

---

## 7. Real-Time Systems

### Supabase Realtime Channels

The app uses Supabase Realtime (PostgreSQL logical replication → WebSocket) for:

| Channel | Trigger | Consumer |
|---|---|---|
| `call_signals` | New signal inserted | `useWebRTC` — processes SDP offer/answer/ICE |
| `call_sessions` | Status change | `useWebRTC` — detects incoming calls, call state changes |
| `user_call_status` | Status change | Calling UI — shows online/offline presence |
| `installer_locations` | New row | `LiveLocationTracker` / HBB HQ map view |
| `jobs` | Status change | Installer dashboard, agent tracking view |
| `notifications` | New row | Push notification bell |
| `social_posts` | New row | Social feed auto-refresh |
| `group_messages` | New row | Group chat live updates |

### GPS Location Tracking

**Installer location flow:**
```
Installer app → Geolocation API (browser/Capacitor)
  → Every 30 seconds (or on significant movement)
  → POST to location endpoint
  → Writes to installer_locations (current week partition)
  → INHOUSE_INSTALLER_6TOWNS_MARCH.last_known_lat/lng updated
  → Supabase Realtime broadcasts change to subscribers
  → HBB HQ map view updates in real-time
```

**Consent gate:** Location tracking only runs when `app_users.gps_tracking_consent = true`. Users are shown a consent prompt on first use (`useLocationTracker` hook checks this flag).

### WebRTC Signaling

Signaling does not use a dedicated WebSocket server — it goes through Supabase Realtime:
1. Caller inserts a row to `call_signals` with `signal_type: 'offer'`.
2. Callee's Realtime subscription fires, reads the offer, inserts `answer`.
3. Both sides exchange `ice_candidate` rows as they're discovered.
4. Either side inserts `hang_up` to end the call.

This approach trades signaling latency (Supabase → database round-trip) for zero infrastructure cost on a dedicated TURN/STUN server. ICE servers are configured via standard WebRTC STUN/TURN config in `useWebRTC`.

---

## 8. Security Model

### Authentication

- **Method:** Phone number + 4-digit PIN.
- **Lookup:** Client-side query directly against Supabase with anon key. RLS policies restrict reads.
- **No JWT tokens:** The app does not use Supabase Auth JWT sessions. It uses direct table lookups with anon key.
- **Session persistence:** Sanitized user object in `localStorage`. PIN and `pin_hash` are stripped before storage by `sanitizeUserForStorage()`.
- **2FA:** Optional TOTP-style second factor (`two_factor_enabled` flag + `TwoFactorModal`).
- **Account locking:** `is_locked` flag set after configurable failed attempts.

### Row Level Security (RLS)

RLS policies are defined on core tables. Key patterns:

| Table | Policy | Effect |
|---|---|---|
| `app_users` | Read own row | Users can only read their own record |
| `submissions` | Read own submissions | Users see only their submissions |
| `social_posts` | Read all published | Anyone can read published posts |
| `group_messages` | Read if member | Only group members can read messages |
| `call_signals` | Read if participant | Only caller/callee can read signals |
| `call_sessions` | Read if participant | Only caller/callee can see session |
| `activity_logs` | Write only | Users can log but not read others' logs |

The `011_webrtc_realtime_rls_fix.sql` migration specifically adds Realtime-compatible RLS policies for the calling tables.

### Edge Function Authentication

Edge functions authenticate callers via the `X-User-Id` header:
- The frontend sends its current `user.id` as `X-User-Id`.
- The server creates a Supabase client with `SERVICE_ROLE_KEY` (bypasses RLS for server-side operations).
- **Important:** This is trust-on-header — the server trusts the client-provided user ID. Role enforcement is done by looking up the user's role from the database, not from a signed token.

### Rate Limiting

Implemented in edge functions via an in-memory map (not persistent across cold starts):
- **HBB service request creation:** 20 requests per minute per IP.
- Pattern: `checkRateLimit(key, limit, windowMs)` from `hbb-utils.tsx`.
- Keys are scoped: `hbb:create-sr:{ip}`.

### Input Sanitization

`hbb-utils.tsx` provides:
- `sanitizeString(value, maxLength)` — strips SQL injection attempts, trims.
- `sanitizeObject(obj)` — recursively sanitizes all string values.
- `normalizeKenyanPhone(phone)` — validates and normalizes Kenyan mobile format.
- `validateServiceRequest(body)` — checks required fields and business rules.
- `checkDuplicate(supabase, phone, estate)` — prevents duplicate service requests.

### Kenyan Phone Number Normalization

All phone numbers are normalized to `0XXXXXXXXX` format (10 digits, starting with 0):
```
0712345678    → 0712345678
+254712345678 → 0712345678
254712345678  → 0712345678
712345678     → 0712345678
```

`phoneFormats()` returns all equivalent representations for database lookups.

---

## 9. GPS Tracking & Job Allocation Scoring

### Job Allocation Scoring Algorithm

**Source:** `src/components/hbb/hbb-auto-assign.ts` — `unifiedAutoAssign()`

**Operating hours:** 07:00–18:00 (Nairobi, EAT/UTC+3). Jobs outside these hours return an error and are queued.

**Score formula:**
```
score = (estateMatch × 0.40) + (workloadScore × 0.30) + (acceptanceRate × 0.20) + (availabilityScore × 0.10)
```

**Component details:**

| Component | Weight | Calculation |
|---|---|---|
| **Estate Match** | 40% | 1.0 if `installer.estate == job.estate_name` (case-insensitive), else 0 |
| **Workload** | 30% | `1 - min(todayCount, maxPerDay) / maxPerDay` (0 jobs = full score, at capacity = 0) |
| **Acceptance Rate** | 20% | `completed / (completed + cancelled)` for last 30 days. Default 0.8 for new installers |
| **Availability** | 10% | 1.0 if `is_available = true`, else 0 |

**Multi-pass search strategy:**

```
Pass 1: Estate exact match (highest priority)
         → all installers in same town where estate matches job.estate_name

Pass 2: Within 2 km radius (requires job GPS coordinates)
         → installers with lat/lng within 2km of customer location

Pass 3: Within 5 km radius
         → expanded radius search

Pass 4: Same town, any estate (last resort)
         → any available installer in the town regardless of estate
```

Each pass scores all candidates and picks the highest scorer.

**Race condition protection (optimistic locking):**
```sql
UPDATE jobs
SET installer_id = ?, status = 'assigned', assigned_at = NOW()
WHERE id = ? AND status IN ('pending', 'open')
```
If 0 rows updated → another process assigned the job first → skip to next candidate.

**Rejection tracking:**
- Rejections are encoded in `jobs.remarks` as `REJECTED_BY:{installer_id}` markers.
- `parseRejectedIds()` extracts rejected installer IDs to exclude from candidate pool.
- After 3 rejections: job promoted to `pending_escalation` status for manual HQ intervention.

**Bulk assignment:**
`bulkAutoAssign()` fetches up to 50 pending jobs and runs `unifiedAutoAssign()` on each with a 100ms throttle between calls to avoid Supabase rate limits.

### GPS Installer Tracking

**Collection:** `useLocationTracker` hook (Geolocation API / Capacitor Geolocation plugin).
- Activates only if `gps_tracking_consent = true` on the user record.
- Updates on position change (default browser geolocation watch).
- Sends coordinates to server.

**Storage:** New rows inserted to `installer_locations` (partitioned by week: `_w13`, `_w14`, etc.).

**Fields recorded:** `installer_id`, `job_id`, `lat`, `lng`, `accuracy`, `recorded_at`.

**Last known position:** `INHOUSE_INSTALLER_6TOWNS_MARCH.last_known_lat/lng` and `last_seen` updated on each location ping for quick "where is this installer" queries without scanning the locations table.

**Distance calculation:**
- Primary: Turf.js `distance()` function with GeoJSON points.
- Fallback: Haversine formula (inline, no dependencies):
  ```
  R = 6371 km
  a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)
  distance = 2R · atan2(√a, √(1−a))
  ```

---

## 10. Edge Function Catalogue

All edge functions are Deno modules using the Hono router, deployed to the Make Supabase project (`mcbbtrrhqweypfnlzwht`). The main entry point (`index.tsx`) mounts each module.

### Base URL
`https://mcbbtrrhqweypfnlzwht.supabase.co/functions/v1/server`

### Route Modules

---

#### `/hbb/*` — HBB CRM Routes (`hbb.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/hbb/towns` | List all HBB towns |
| GET | `/hbb/installers?town=` | List installers, optionally filtered by town |
| GET | `/hbb/installer-by-phone?phone=` | Find installer by phone number |
| GET | `/hbb/service-requests` | List jobs (filterable by status, agent_phone, installer_id; paginated) |
| POST | `/hbb/service-requests` | Create new service request / lead |
| PUT | `/hbb/service-requests/:id` | Update job status (accepts UUID or legacy bigint ID) |
| GET | `/hbb/stats?agent_phone=` | Dashboard stats for an agent or all agents |

**Inputs (POST /hbb/service-requests):**
```json
{
  "customer_name": "string",
  "customer_phone": "0XXXXXXXXX",
  "town": "string",
  "estate": "string",
  "package": "string",
  "preferred_date": "YYYY-MM-DD",
  "preferred_time": "HH:MM",
  "agent_name": "string",
  "agent_phone": "0XXXXXXXXX",
  "remarks": "string"
}
```

**Rate limit:** 20 POST requests/minute/IP.

---

#### `/programs/*` — Program Management (`programs.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/programs` | List all programs |
| POST | `/programs` | Create program (Director/HQ only) |
| PUT | `/programs/:id` | Update program |
| DELETE | `/programs/:id` | Delete program |
| GET | `/programs/:id/analytics` | Program analytics |
| POST | `/programs/checkin` | Check-in to a session-linked program |

---

#### `/submissions/*` — Submission Management (`submissions.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/submissions` | List submissions (filterable) |
| POST | `/submissions` | Create submission |
| PUT | `/submissions/:id` | Approve/reject submission |
| POST | `/submissions/bulk` | Bulk approve/reject |

---

#### `/social/*` — Social Feed (`social.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/social/posts` | List posts (paginated, sorted by trending score) |
| POST | `/social/posts` | Create post |
| POST | `/social/posts/:id/like` | Toggle like |
| POST | `/social/posts/:id/comment` | Add comment |
| DELETE | `/social/posts/:id` | Delete post |
| GET | `/social/trending` | Top trending hashtags |

---

#### `/analytics/*` — Analytics (`analytics.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/leaderboard` | Full leaderboard |
| GET | `/analytics/summary` | Aggregate KPIs |
| GET | `/analytics/achievements` | Achievement definitions |
| POST | `/analytics/achievements/check` | Check and award achievements |

---

#### `/groups/*` — Group Management (`groups.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/groups` | List groups for user |
| POST | `/groups` | Create group |
| GET | `/groups/:id/messages` | Get messages (with KV cache) |
| POST | `/groups/:id/messages` | Send message |
| POST | `/groups/:id/members` | Add member |
| DELETE | `/groups/:id/members/:userId` | Remove member |

---

#### `/announcements/*` — Announcements (`announcements.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/announcements` | List announcements |
| POST | `/announcements` | Create (HQ/Director only) |
| PUT | `/announcements/:id/read` | Mark as read |
| DELETE | `/announcements/:id` | Delete |

---

#### `/vans/*` — Van Management (`vans.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/vans` | List vans (filterable by plate, vendor, zone) |
| GET | `/vans/:id` | Van details |
| POST | `/vans` | Create van record |
| PUT | `/vans/:id` | Update van |

---

#### `/van-calendar/*` — Van Calendar (`van-calendar.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/van-calendar/schedule` | Get schedule for month |
| POST | `/van-calendar/schedule` | Create scheduling entry |
| GET | `/van-calendar/conflicts` | Get conflict records |

---

#### `/activity/*` — Activity Logging (`activity.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/activity` | Log user action |
| GET | `/activity` | Get activity log (HQ only) |

---

#### `/admin/*` — Admin Operations (`admin.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/users/bulk` | Bulk import users |
| GET | `/admin/users` | List all users |
| PUT | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Deactivate user |

---

#### `/checkin/*` — Check-in System (`checkin.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/checkin` | Record check-in (GPS + timestamp) |
| POST | `/checkout` | Record check-out |
| GET | `/checkin/status/:userId` | Get current session status |

---

#### `/hq-directors/*` — HQ Director Management (`hq-directors.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/hq-directors` | List HQ directors |
| POST | `/hq-directors` | Create director account |
| PUT | `/hq-directors/:id` | Update director |

---

#### `/locations/*` — Location Data (`locations.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/locations` | Record installer location ping |
| GET | `/locations/:installerId` | Get location history |

---

#### `/push-notifications/*` — Web Push (`push-notifications.tsx`, `web-push.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/push/subscribe` | Register push subscription |
| POST | `/push/send` | Send push notification to user(s) |

---

#### `/user-upload/*` — Bulk User Import (`user-upload.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/user-upload/stage` | Stage user upload batch |
| POST | `/user-upload/promote` | Promote staged batch to live |
| POST | `/user-upload/rollback` | Roll back a batch |
| GET | `/user-upload/batches` | List upload batches |

---

#### `/mobile-api/*` — Mobile-Specific (`mobile-api.tsx`)

Mobile-optimized endpoints with lighter payloads for Capacitor native apps.

---

#### `/offline-sync/*` — Offline Sync (`offline-sync.tsx`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/offline-sync` | Sync queued offline actions |

---

#### `/webhooks/*` — Webhook Handlers (`webhooks.tsx`)

Inbound webhooks from external systems (Airtel backend integrations).

---

#### `/health` — Health Check (`health.tsx`)

```
GET /health → 200 OK {"status": "healthy", "timestamp": "..."}
```

---

#### `/image-processing/*` — Image Processing (`image-processing.tsx`)

Server-side image resizing/compression for uploaded photos.

---

#### Utility Modules (not exposed as HTTP routes)

| Module | Purpose |
|---|---|
| `hbb-utils.tsx` | Phone normalization, rate limiting, session management, input sanitization |
| `kv_store.tsx` | Supabase KV store wrapper (safe get/set/delete) |
| `storage-kv.tsx` | Extended KV operations |
| `middleware.tsx` | CORS, auth header extraction |
| `validation.tsx` | Common input validators |
| `security.tsx` | Security utilities |
| `performance.tsx` | Performance monitoring helpers |
| `database-setup.tsx` | Database initialization routines |
| `van-db-setup.tsx` | Van database initialization |
| `storage-setup.tsx` | Supabase storage bucket setup |
| `migrations.tsx` | Migration execution via API |
| `programs-kv.tsx` | KV-based program caching |
| `deploy.tsx` | Deployment helper utilities |
| `fix-kv-permissions.tsx` | KV table permission repair |
| `database-dropdown.tsx` | Database utility queries |

---

## 11. Deployment Architecture

### Frontend

**Build:** `npm run build` → Vite bundles to `/dist`.

**Deploy targets:**
- **Vercel** (primary) — `vercel.json` configuration present. Static SPA deployment with all routes redirected to `index.html`.
- **PWA** — Service worker registered on build. `vite-plugin-pwa` generates `manifest.webmanifest` and Workbox service worker.

**Build output:** `/dist/assets/` contains hashed JS/CSS bundles. `index.html` is the entry point for the SPA.

### Backend (Edge Functions)

**Runtime:** Deno on Supabase Edge Functions.

**Deploy:** `supabase functions deploy server` (deploys the entire `src/supabase/functions/server/` directory as one function).

**Environment variables required:**

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Make project Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for Make project |
| `FRONTEND_SUPABASE_URL` | Frontend project URL (`xspogpfohjmkykfjadhk.supabase.co`) |
| `FRONTEND_SUPABASE_ANON_KEY` | Frontend project anon key |

**Fallbacks:** `hbb.tsx` hardcodes the frontend Supabase URL and anon key as fallback constants if env vars are missing or malformed.

### Database

**Platform:** Supabase PostgreSQL (managed).

**Two projects:**
1. **Make project** (`mcbbtrrhqweypfnlzwht`) — Hosts edge functions, KV store tables.
2. **Frontend project** (`xspogpfohjmkykfjadhk`) — Primary data store (all user, HBB, program, social data).

**Migrations:** Located in `src/supabase/migrations/`. Applied via `supabase db push` or the migrations edge function endpoint.

**Schema file:** `.schema.sql` in project root is a reference export (NOT for direct execution — table order and FK constraints may conflict).

### Mobile (Native)

**Framework:** Capacitor wraps the web app for native deployment.

**Native features:**
- Camera access via `@capacitor/camera`.
- Geolocation via `@capacitor/geolocation`.
- OTA updates via `@capgo/capacitor-updater` (checks `app_versions` table).

**App stores:** Android primary target (based on `app_versions.platform` default of `android`).

### CI/CD

**Testing:**
- Unit tests: Jest (`npm test`).
- E2E tests: Playwright (`@playwright/test`).
- UAT automation: Custom Node.js scripts (`npm run uat:*`) — multiple levels of automation from basic to self-improving.

**Scripts:**
```bash
npm run dev           # Vite dev server (localhost:5173)
npm run build         # Production build → /dist
npm run test          # Jest unit tests
npm run uat:full      # Full UAT automation
npm run uat:browser-test  # Playwright browser tests
```

### Monitoring

- **`activity_logs`** table captures all user actions for audit and analytics.
- **`user_sessions`** tracks all login sessions.
- **`app-usage-analytics.tsx`** provides in-app usage dashboards.
- **`diagnostic-panel.tsx`** — in-app diagnostics for debugging production issues.
- **Performance monitoring:** `usePerformanceTracking` hook + `performance.tsx` edge module.

---

## Appendix: Key File Index

| File | Purpose |
|---|---|
| `src/App.tsx` | Root — auth, routing, global modals |
| `src/components/AppState.ts` | Zustand global store |
| `src/components/hbb/hbb-auto-assign.ts` | Job allocation scoring engine |
| `src/components/hbb/hbb-api.ts` | HBB API client wrapper |
| `src/supabase/functions/server/hbb.tsx` | HBB HTTP routes (Hono) |
| `src/supabase/functions/server/hbb-utils.tsx` | Phone normalization, rate limiting |
| `src/supabase/functions/server/index.tsx` | Edge function entry point |
| `src/utils/supabase/client.ts` | Supabase client singleton |
| `src/hooks/useWebRTC.tsx` | WebRTC calling hook |
| `src/hooks/useLocationTracker.ts` | GPS tracking hook |
| `src/lib/activity-tracker.ts` | Activity logging service |
| `src/lib/session-tracker.ts` | Session management |
| `.schema.sql` | Full DB schema reference |
| `src/supabase/migrations/20260410_merge_hbb_tables.sql` | HBB table consolidation migration |
| `package.json` | All dependencies and scripts |
| `vercel.json` | Vercel deployment config |
