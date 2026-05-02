# Program Whitelist Feature — Design Spec
**Date:** 2026-05-02  
**Status:** Approved  
**Scope:** Promoter Team Lead whitelisting via program submission (Airtel Champions Sales target deferred)

---

## Overview

A program can be configured so that submitting its form automatically whitelists a person into a login system. The person filling the form provides details about someone else (name, MSISDN, cluster, ZSM), and on successful submission that person is created as an account in the target table — giving them login access without a separate admin step.

The feature is off by default. It is toggled on per-program in the Settings tab. The field configuration is dynamic and extensible: new target tables or new columns can be added in the future without a schema change to `programs`.

---

## Database Changes

### `programs` table — 3 new columns

```sql
ALTER TABLE public.programs
  ADD COLUMN whitelist_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN whitelist_target text,
  ADD COLUMN whitelist_fields jsonb NOT NULL DEFAULT '[]';
```

**`whitelist_target`** allowed values (extensible): `'promoter_team_lead'` | `'airtel_champions'`

**`whitelist_fields`** is an array of field config objects:

```json
[
  {
    "label": "Name",
    "db_column": "full_name",
    "input_type": "text"
  },
  {
    "label": "MSISDN",
    "db_column": "msisdn",
    "input_type": "text"
  },
  {
    "label": "Cluster",
    "db_column": "se_cluster",
    "input_type": "dropdown",
    "source_table": "sitewise",
    "source_column": "CLUSTER (691)"
  },
  {
    "label": "ZSM",
    "db_column": "zone",
    "input_type": "dropdown",
    "source_table": "ZSM_MARCH",
    "source_column": "ZSM NAME"
  }
]
```

Adding a future column (e.g. `region`) requires only adding a new object to this array — no DB schema change needed.

### Migration file

`supabase/migrations/<timestamp>_add_whitelist_to_programs.sql` — filename timestamp set at implementation time.

---

## Settings UI — `program-creator-enhanced.tsx`

Location: Settings tab, after the existing toggles (after Session-Based Check-In card).

### New "Whitelist" card

```
[ ] Enable Whitelisting
```

When toggled ON:

```
Target: [ Promoter Team Lead ▾ ]   (dropdown, only option for now)

Whitelist Fields
┌──────────────┬──────────────┬────────────────┬──────────────┬──────────────┐
│ Label        │ DB Column    │ Type           │ Source Table │ Source Col   │
├──────────────┼──────────────┼────────────────┼──────────────┼──────────────┤
│ Name         │ full_name    │ Text           │ —            │ —            │
│ MSISDN       │ msisdn       │ Text           │ —            │ —            │
│ Cluster      │ se_cluster   │ Dropdown       │ sitewise     │ CLUSTER(691) │
│ ZSM          │ zone         │ Dropdown       │ ZSM_MARCH    │ ZSM NAME     │
└──────────────┴──────────────┴────────────────┴──────────────┴──────────────┘
[ + Add Field ]
```

- When target is selected for the first time, the 4 Promoter TL fields are pre-populated as a starter config.
- Admins can edit labels, change source tables/columns, add rows, or remove rows.
- Source table selector fetches table names dynamically via `GET /schema/tables`.
- Source column selector fetches columns dynamically via `GET /schema/tables/:table/columns` after a table is chosen.
- `whitelist_enabled`, `whitelist_target`, and `whitelist_fields` are saved alongside other program settings.

---

## Form Rendering — submission form

When `whitelist_enabled === true` on a program, the submission modal renders a **"Whitelist Details"** section above the regular form fields.

- **Text fields**: standard `<input type="text">` 
- **Dropdown fields**: `<select>` populated by `GET /whitelist/options?table=X&column=Y` which returns distinct non-null values from that table/column.
- All whitelist fields are **required** — the form cannot be submitted without them.
- The section is visually distinct (e.g. a labelled card or divider: "New Member Details").

---

## Server — New Endpoints

All under the existing server prefix (`/make-server-28f2f653/`).

### `GET /schema/tables`
Returns the list of all user-facing table names from `information_schema.tables` (schema = `public`, table_type = `BASE TABLE`).

```json
{ "tables": ["ZSM_MARCH", "sitewise", "SE_MARCH", "app_users", ...] }
```

### `GET /schema/tables/:tableName/columns`
Returns column names for a given table from `information_schema.columns`.

```json
{ "columns": ["ZSM NAME", "TERRITORY", "ZSM MSISDN", ...] }
```

### `GET /whitelist/options`
Query params: `table`, `column`  
Returns distinct non-null values from `table.column`, sorted alphabetically, for populating dropdowns.

```json
{ "options": ["EZRA MUTAI", "JOHN DOE", ...] }
```

---

## Server — Submission Handler

In the existing `POST /programs/:id/submit` endpoint in `programs.tsx`:

**After** the existing van-checkout enforcement check, **before** saving the submission:

1. Fetch `whitelist_enabled`, `whitelist_target`, `whitelist_fields` from the program row.
2. If `whitelist_enabled` is false → skip all whitelist logic, proceed normally.
3. Extract values from `body.responses` using the key convention `__wl_<db_column>` (e.g. `__wl_full_name`, `__wl_msisdn`, `__wl_se_cluster`, `__wl_zone`). The form renderer uses this same prefix when writing whitelist field values into `responses`, keeping them separate from regular form fields.
4. Validate all whitelist fields are present (belt-and-suspenders, form already enforces this).
5. **Duplicate check**: query target table for the submitted MSISDN.
   - If found → return `409` with message: `"This MSISDN is already registered as a Promoter Team Lead."`
   - Submission is **not saved** — the submitter must correct the MSISDN.
6. Insert into `promoter_team_leads`:
   ```sql
   INSERT INTO promoter_team_leads (full_name, msisdn, zone, se_cluster, password_hash, is_active)
   VALUES ($name, $msisdn, $zone, $se_cluster, $hashed_1234, true)
   ```
   `password_hash` = bcrypt hash of `"1234"` (same algorithm used elsewhere in the promoter TL login flow).
7. If insert fails for any reason → return `500`, do not save submission.
8. If insert succeeds → continue with the normal submission save flow.

---

## Target Table Mapping

| Target value | Table | Columns written |
|---|---|---|
| `promoter_team_lead` | `promoter_team_leads` | `full_name`, `msisdn`, `zone`, `se_cluster`, `password_hash` |
| `airtel_champions` *(future)* | `app_users` | `full_name`, `phone_number`, `role`, `pin`, `is_active` |

---

## Error States

| Scenario | Behaviour |
|---|---|
| MSISDN already in `promoter_team_leads` | 409 error, submission blocked, clear message shown |
| Whitelist insert fails (DB error) | 500 error, submission blocked |
| Dropdown source table/column returns no data | Empty select rendered, field still required |
| `whitelist_fields` is empty but `whitelist_enabled=true` | Treated as misconfigured — form skips whitelist section, server skips whitelist logic |

---

## Out of Scope (this iteration)

- Airtel Champions Sales (`app_users`) whitelisting — deferred
- Editing or revoking a whitelist entry from the program UI
- Notifying the whitelisted person (e.g. SMS)
- Audit log of who was whitelisted via which program
