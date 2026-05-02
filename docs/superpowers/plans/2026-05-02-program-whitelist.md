# Program Whitelist Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-program whitelist toggle that, on form submission, auto-creates a Promoter Team Lead entry in `promoter_team_leads` using field values collected from the submission form.

**Architecture:** Three layers — (1) DB helper functions for schema introspection, (2) three new server endpoints plus an extended submit handler in `programs.tsx`, (3) settings card in the program creator and a whitelist section in the submission modal. Whitelist field configs are stored as JSONB in `programs.whitelist_fields`. Form values use a `__wl_<db_column>` key prefix in the `responses` object to stay separate from regular form fields.

**Tech Stack:** React/TypeScript, Hono, Supabase JS v2, Deno Edge Functions, bcryptjs (npm)

---

## File Map

| File | Change |
|---|---|
| Supabase SQL editor | Run migration: 3 helper DB functions |
| `src/supabase/functions/server/programs.tsx` | Add 3 endpoints; extend submit handler |
| `src/components/programs/program-creator-enhanced.tsx` | Add state + whitelist card + save/load |
| `src/components/programs/program-submit-modal.tsx` | Update Program interface; render whitelist section; merge `__wl_*` into payload |

> **DB columns already applied:** `whitelist_enabled`, `whitelist_target`, `whitelist_fields` were added to `programs` on 2026-05-02 — no column migration needed.

---

### Task 1: DB migration — 3 helper SQL functions

**Files:** Run in Supabase SQL editor, then save as a migration file.

- [ ] **Step 1: Run this SQL in the Supabase SQL editor**

```sql
-- Returns all public base tables (for the table picker)
CREATE OR REPLACE FUNCTION get_public_tables()
RETURNS TABLE(table_name text)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT table_name::text
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name;
$$;

-- Returns column names for a given table (for the column picker)
CREATE OR REPLACE FUNCTION get_table_columns(p_table_name text)
RETURNS TABLE(column_name text)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT column_name::text
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = p_table_name
  ORDER BY ordinal_position;
$$;

-- Returns distinct non-null values from any table+column (for dropdown options)
CREATE OR REPLACE FUNCTION get_distinct_values(p_table text, p_column text)
RETURNS TABLE(value text)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT DISTINCT %I::text FROM public.%I WHERE %I IS NOT NULL ORDER BY 1 LIMIT 200',
    p_column, p_table, p_column
  );
END;
$$;
```

- [ ] **Step 2: Verify each function works**

Run in SQL editor:
```sql
SELECT * FROM get_public_tables() LIMIT 5;
SELECT * FROM get_table_columns('ZSM_MARCH');
SELECT * FROM get_distinct_values('ZSM_MARCH', 'ZSM NAME') LIMIT 5;
```

Expected: rows returned for each, no errors.

- [ ] **Step 3: Save as migration file and commit**

Create `supabase/migrations/20260502_whitelist_helper_functions.sql` with the SQL from Step 1, then:

```bash
git add supabase/migrations/20260502_whitelist_helper_functions.sql
git commit -m "feat(db): add schema introspection helper functions for whitelist configurator"
```

---

### Task 2: Server — 3 new endpoints

**Files:**
- Modify: `src/supabase/functions/server/programs.tsx`

- [ ] **Step 1: Find the `export default app` line at the bottom of programs.tsx**

This line is the last line of the file. All new endpoints go immediately before it.

- [ ] **Step 2: Insert the 3 new endpoints immediately before `export default app`**

```typescript
// ─── Whitelist: schema introspection + dropdown options ──────────────────────

app.get('/make-server-28f2f653/schema/tables', async (c) => {
  const { data, error } = await supabase.rpc('get_public_tables');
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ tables: (data as { table_name: string }[]).map(r => r.table_name) });
});

app.get('/make-server-28f2f653/schema/tables/:tableName/columns', async (c) => {
  const tableName = c.req.param('tableName');
  const { data, error } = await supabase.rpc('get_table_columns', { p_table_name: tableName });
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ columns: (data as { column_name: string }[]).map(r => r.column_name) });
});

app.get('/make-server-28f2f653/whitelist/options', async (c) => {
  const table = c.req.query('table');
  const column = c.req.query('column');
  if (!table || !column) return c.json({ error: 'table and column are required' }, 400);
  const { data, error } = await supabase.rpc('get_distinct_values', {
    p_table: table,
    p_column: column,
  });
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ options: (data as { value: string }[]).map(r => r.value) });
});

// ─────────────────────────────────────────────────────────────────────────────
```

- [ ] **Step 3: Verify endpoints respond**

After deploying, test with curl or browser:
```
GET /make-server-28f2f653/schema/tables
→ { "tables": ["ZSM_MARCH", "sitewise", ...] }

GET /make-server-28f2f653/schema/tables/ZSM_MARCH/columns
→ { "columns": ["ZSM NAME", "TERRITORY", "ZSM MSISDN", ...] }

GET /make-server-28f2f653/whitelist/options?table=ZSM_MARCH&column=ZSM%20NAME
→ { "options": ["EZRA MUTAI", "JOHN DOE", ...] }
```

- [ ] **Step 4: Commit**

```bash
git add src/supabase/functions/server/programs.tsx
git commit -m "feat(server): add schema introspection and whitelist options endpoints"
```

---

### Task 3: Settings UI — Whitelist state + card

**Files:**
- Modify: `src/components/programs/program-creator-enhanced.tsx`

- [ ] **Step 1: Add the `WhitelistField` type and starter config constant**

Find the block of `interface` / `type` definitions near the top of the file (before the component function declaration). Add after the last type:

```typescript
interface WhitelistField {
  label: string;
  db_column: string;
  input_type: 'text' | 'dropdown';
  source_table?: string;
  source_column?: string;
}

const PROMOTER_TL_WHITELIST_DEFAULTS: WhitelistField[] = [
  { label: 'Name',    db_column: 'full_name',  input_type: 'text' },
  { label: 'MSISDN',  db_column: 'msisdn',     input_type: 'text' },
  { label: 'Cluster', db_column: 'se_cluster', input_type: 'dropdown', source_table: '', source_column: '' },
  { label: 'ZSM',     db_column: 'zone',       input_type: 'dropdown', source_table: '', source_column: '' },
];
```

- [ ] **Step 2: Add state variables**

Find the toggle state declarations at ~line 116 (the block with `pointsEnabled`, `gpsAutoDetectEnabled`, `sessionCheckinEnabled`, etc.). Add immediately after `sessionCheckinEnabled`:

```typescript
const [whitelistEnabled, setWhitelistEnabled] = useState(false);
const [whitelistTarget, setWhitelistTarget] = useState<'promoter_team_lead' | 'airtel_champions' | ''>('');
const [whitelistFields, setWhitelistFields] = useState<WhitelistField[]>([]);
const [availableTables, setAvailableTables] = useState<string[]>([]);
const [availableColumns, setAvailableColumns] = useState<Record<number, string[]>>({});
```

- [ ] **Step 3: Add a useEffect to load the tables list when whitelist is first enabled**

Find where other `useEffect` hooks are declared. Add:

```typescript
useEffect(() => {
  if (!whitelistEnabled || availableTables.length > 0) return;
  // Look for the server base URL pattern used elsewhere in this file.
  // Search for `make-server-28f2f653` to find the exact URL constant.
  fetch(`${SERVER_BASE}/schema/tables`)
    .then(r => r.json())
    .then(d => setAvailableTables(d.tables ?? []))
    .catch(console.error);
}, [whitelistEnabled]);
```

Replace `SERVER_BASE` with the exact constant or URL string already used in this file for server calls. Search for `make-server-28f2f653` in the file to find it.

- [ ] **Step 4: Add the `fetchColumnsForField` helper inside the component**

Near other handler functions in the component, add:

```typescript
const fetchColumnsForField = async (fieldIndex: number, tableName: string) => {
  if (!tableName) return;
  const res = await fetch(`${SERVER_BASE}/schema/tables/${encodeURIComponent(tableName)}/columns`);
  const d = await res.json();
  setAvailableColumns(prev => ({ ...prev, [fieldIndex]: d.columns ?? [] }));
};
```

Again replace `SERVER_BASE` with the correct constant.

- [ ] **Step 5: Add the Whitelist card UI in the Settings tab**

Find the Session Check-In card (the `div` starting with `bg-gradient-to-r from-indigo-50 to-purple-50` at ~line 1721). Add the following immediately after that card's closing `</div>`:

```tsx
{/* ── Auto Whitelist ─────────────────────────────────────────────────────── */}
<div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-6">
  <div className="flex items-start gap-4">
    <input
      type="checkbox"
      id="whitelistEnabled"
      checked={whitelistEnabled}
      onChange={(e) => {
        setWhitelistEnabled(e.target.checked);
        if (!e.target.checked) {
          setWhitelistTarget('');
          setWhitelistFields([]);
        }
      }}
      className="w-6 h-6 text-emerald-600 rounded-lg focus:ring-2 focus:ring-emerald-500 mt-0.5 cursor-pointer"
    />
    <div className="flex-1">
      <label htmlFor="whitelistEnabled" className="text-base font-bold text-gray-800 cursor-pointer flex items-center gap-2">
        <span>✅ Auto Whitelist on Submission</span>
      </label>
      <p className="text-sm text-gray-600 mt-1">
        {whitelistEnabled
          ? 'Submitting this form will automatically create a login account for the person whose details are collected.'
          : 'Disabled. Submissions do not create any login accounts.'}
      </p>

      {whitelistEnabled && (
        <div className="mt-4 space-y-4">
          {/* Target selector */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Whitelist Target</label>
            <select
              value={whitelistTarget}
              onChange={(e) => {
                const t = e.target.value as typeof whitelistTarget;
                setWhitelistTarget(t);
                if (t === 'promoter_team_lead' && whitelistFields.length === 0) {
                  setWhitelistFields([...PROMOTER_TL_WHITELIST_DEFAULTS]);
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">— Select target —</option>
              <option value="promoter_team_lead">Promoter Team Lead</option>
            </select>
          </div>

          {/* Field configuration */}
          {whitelistTarget && (
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Whitelist Fields</label>
              <div className="space-y-3">
                {whitelistFields.map((field, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Label</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => {
                            const updated = [...whitelistFields];
                            updated[idx] = { ...updated[idx], label: e.target.value };
                            setWhitelistFields(updated);
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">DB Column</label>
                        <input
                          type="text"
                          value={field.db_column}
                          onChange={(e) => {
                            const updated = [...whitelistFields];
                            updated[idx] = { ...updated[idx], db_column: e.target.value };
                            setWhitelistFields(updated);
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="w-28">
                        <label className="text-xs text-gray-500 block mb-1">Type</label>
                        <select
                          value={field.input_type}
                          onChange={(e) => {
                            const updated = [...whitelistFields];
                            updated[idx] = {
                              ...updated[idx],
                              input_type: e.target.value as 'text' | 'dropdown',
                              source_table: '',
                              source_column: '',
                            };
                            setWhitelistFields(updated);
                            setAvailableColumns(prev => {
                              const next = { ...prev };
                              delete next[idx];
                              return next;
                            });
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="dropdown">Dropdown</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWhitelistFields(whitelistFields.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 font-bold px-2 py-1 text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    {field.input_type === 'dropdown' && (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">Source Table</label>
                          <select
                            value={field.source_table ?? ''}
                            onChange={(e) => {
                              const updated = [...whitelistFields];
                              updated[idx] = { ...updated[idx], source_table: e.target.value, source_column: '' };
                              setWhitelistFields(updated);
                              fetchColumnsForField(idx, e.target.value);
                            }}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            <option value="">— Select table —</option>
                            {availableTables.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-1">Source Column</label>
                          <select
                            value={field.source_column ?? ''}
                            onChange={(e) => {
                              const updated = [...whitelistFields];
                              updated[idx] = { ...updated[idx], source_column: e.target.value };
                              setWhitelistFields(updated);
                            }}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            disabled={!field.source_table}
                          >
                            <option value="">— Select column —</option>
                            {(availableColumns[idx] ?? []).map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setWhitelistFields([
                  ...whitelistFields,
                  { label: '', db_column: '', input_type: 'text' },
                ])}
                className="mt-2 text-sm text-emerald-700 font-semibold hover:underline"
              >
                + Add Field
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
</div>
```

- [ ] **Step 6: Verify the card renders**

Open the program creator → Settings tab → scroll to bottom. The Whitelist card should appear. Toggle ON → select "Promoter Team Lead" → 4 preset fields appear. Change Cluster/ZSM type to Dropdown → table/column pickers appear and populate from the server.

---

### Task 4: Settings UI — Save and load whitelist config

**Files:**
- Modify: `src/components/programs/program-creator-enhanced.tsx`

- [ ] **Step 1: Add whitelist fields to the UPDATE payload**

Find the Supabase `.update({...})` call at ~line 850 (the one that includes `van_checkout_enforcement_enabled`). Add inside the update object:

```typescript
whitelist_enabled: whitelistEnabled,
whitelist_target: whitelistTarget || null,
whitelist_fields: whitelistFields,
```

- [ ] **Step 2: Add whitelist fields to the CREATE payload**

Find the Supabase `.insert({...})` call for new programs in the same save function. Add the same three fields:

```typescript
whitelist_enabled: whitelistEnabled,
whitelist_target: whitelistTarget || null,
whitelist_fields: whitelistFields,
```

- [ ] **Step 3: Load whitelist config when editing an existing program**

Find the `useEffect` that reads from `editingProgram` and sets state like `setTitle(editingProgram.title)`, `setPointsEnabled(editingProgram.points_enabled)`, etc. Add inside it:

```typescript
setWhitelistEnabled(editingProgram.whitelist_enabled ?? false);
setWhitelistTarget((editingProgram.whitelist_target as typeof whitelistTarget) ?? '');
setWhitelistFields((editingProgram.whitelist_fields as WhitelistField[]) ?? []);
```

- [ ] **Step 4: Load columns for any pre-existing dropdown fields when editing**

In the same `useEffect` (after the three lines above), add:

```typescript
if (editingProgram.whitelist_fields?.length) {
  (editingProgram.whitelist_fields as WhitelistField[]).forEach((field, idx) => {
    if (field.input_type === 'dropdown' && field.source_table) {
      fetchColumnsForField(idx, field.source_table);
    }
  });
}
```

- [ ] **Step 5: Verify save/load round-trip**

1. Create a program, enable whitelist, configure Cluster → `ZSM_MARCH` / `ZSM NAME`. Save.
2. Re-open in edit mode — toggle, target, and all field configs including source table/column should be restored.

- [ ] **Step 6: Commit**

```bash
git add src/components/programs/program-creator-enhanced.tsx
git commit -m "feat(ui): add whitelist card to program settings with save/load support"
```

---

### Task 5: Submit modal — Whitelist fields section

**Files:**
- Modify: `src/components/programs/program-submit-modal.tsx`

- [ ] **Step 1: Update the Program interface**

Find `interface Program` at ~line 1. Add three properties:

```typescript
whitelist_enabled?: boolean;
whitelist_target?: string;
whitelist_fields?: {
  label: string;
  db_column: string;
  input_type: 'text' | 'dropdown';
  source_table?: string;
  source_column?: string;
}[];
```

- [ ] **Step 2: Add whitelist state**

Find the block of `useState` declarations inside the component. Add:

```typescript
const [whitelistResponses, setWhitelistResponses] = useState<Record<string, string>>({});
const [whitelistOptions, setWhitelistOptions] = useState<Record<string, string[]>>({});
```

- [ ] **Step 3: Fetch dropdown options when the program loads**

Find where other `useEffect` hooks that depend on `program` are declared. Add:

```typescript
useEffect(() => {
  if (!program?.whitelist_enabled || !program.whitelist_fields?.length) return;
  setWhitelistResponses({});
  const dropdownFields = program.whitelist_fields.filter(
    f => f.input_type === 'dropdown' && f.source_table && f.source_column
  );
  if (!dropdownFields.length) return;
  // Find SERVER_BASE by searching for `make-server-28f2f653` in this file.
  Promise.all(
    dropdownFields.map(async (f) => {
      const res = await fetch(
        `${SERVER_BASE}/whitelist/options?table=${encodeURIComponent(f.source_table!)}&column=${encodeURIComponent(f.source_column!)}`
      );
      const d = await res.json();
      return { key: f.db_column, options: (d.options ?? []) as string[] };
    })
  ).then(results => {
    const map: Record<string, string[]> = {};
    results.forEach(r => { map[r.key] = r.options; });
    setWhitelistOptions(map);
  }).catch(console.error);
}, [program?.id, program?.whitelist_enabled]);
```

Replace `SERVER_BASE` with the constant used elsewhere in this file for server calls (search `make-server-28f2f653` in the file to find it).

- [ ] **Step 4: Render the whitelist section above the form fields loop**

Find `{fields.map((field, fieldIndex) => {` at ~line 1524. Add the following immediately before it:

```tsx
{/* ── Whitelist Details ────────────────────────────────────────────────── */}
{program?.whitelist_enabled && (program.whitelist_fields?.length ?? 0) > 0 && (
  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
    <h3 className="text-sm font-bold text-emerald-800 mb-3">New Member Details</h3>
    <div className="space-y-3">
      {program.whitelist_fields!.map((field) => {
        const key = `__wl_${field.db_column}`;
        return (
          <div key={field.db_column}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} <span className="text-red-500">*</span>
            </label>
            {field.input_type === 'text' ? (
              <input
                type="text"
                value={whitelistResponses[key] ?? ''}
                onChange={(e) =>
                  setWhitelistResponses(prev => ({ ...prev, [key]: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            ) : (
              <select
                value={whitelistResponses[key] ?? ''}
                onChange={(e) =>
                  setWhitelistResponses(prev => ({ ...prev, [key]: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">— Select {field.label} —</option>
                {(whitelistOptions[field.db_column] ?? []).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}
```

- [ ] **Step 5: Validate whitelist fields before submission**

Find the submit handler function (search for `handleSubmit` or the function that calls the submit server endpoint). Add at the very start of it, before any server calls:

```typescript
if (program?.whitelist_enabled && (program.whitelist_fields?.length ?? 0) > 0) {
  const missing = program.whitelist_fields!.filter(f => {
    const key = `__wl_${f.db_column}`;
    return !whitelistResponses[key]?.trim();
  });
  if (missing.length > 0) {
    alert(`Please fill in: ${missing.map(f => f.label).join(', ')}`);
    return;
  }
}
```

- [ ] **Step 6: Merge `__wl_*` into the responses payload**

Find where the `responses` object is built before being sent to the server. It will look like:
```typescript
const payload = {
  responses: { ...someFormValues },
  photos: ...,
  location: ...,
};
```
Change the `responses` value to include the whitelist responses:

```typescript
responses: { ...someFormValues, ...whitelistResponses },
```

`whitelistResponses` is `{}` when whitelist is disabled, so this is always safe to spread.

- [ ] **Step 7: Verify in browser**

Open a whitelist-enabled program's submission modal:
- "New Member Details" section appears at the top
- Cluster/ZSM dropdowns populate from the DB
- Submitting without filling fields shows the alert
- Filling all fields and submitting proceeds to the server

- [ ] **Step 8: Commit**

```bash
git add src/components/programs/program-submit-modal.tsx
git commit -m "feat(ui): render whitelist fields in submission modal and include in payload"
```

---

### Task 6: Server submit handler — whitelist insert

**Files:**
- Modify: `src/supabase/functions/server/programs.tsx`

- [ ] **Step 1: Add bcryptjs import at the top of programs.tsx**

Find the existing `import` block at the top. Add:

```typescript
import bcrypt from 'npm:bcryptjs';
```

- [ ] **Step 2: Extend the program SELECT to include whitelist columns**

Find the `.select(...)` inside the submit endpoint (the one that fetches `points_value, title, van_checkout_enforcement_enabled`). Change it to:

```typescript
.select('points_value, title, van_checkout_enforcement_enabled, whitelist_enabled, whitelist_target, whitelist_fields')
```

- [ ] **Step 3: Add the whitelist insert block**

Find the van checkout enforcement block — the `if (isCheckinProgram(program.title)) { ... }` section. Add the following immediately **after** that block's closing brace and **before** the `supabase.from('submissions').insert(...)` call:

```typescript
// ── Whitelist: auto-create login account ─────────────────────────────────────
if (program.whitelist_enabled && Array.isArray(program.whitelist_fields) && program.whitelist_fields.length > 0) {
  type WLField = { label: string; db_column: string; input_type: string };
  const wlFields = program.whitelist_fields as WLField[];

  // Extract __wl_* values from the submitted responses
  const wlData: Record<string, string> = {};
  for (const field of wlFields) {
    const key = `__wl_${field.db_column}`;
    const value = (responses as Record<string, unknown>)[key];
    if (typeof value === 'string') wlData[field.db_column] = value.trim();
  }

  const msisdn = wlData['msisdn'];
  if (!msisdn) {
    return c.json({ error: 'Whitelist: MSISDN is required' }, 400);
  }

  if (program.whitelist_target === 'promoter_team_lead') {
    // Block duplicate MSISDNs
    const { data: existing } = await supabase
      .from('promoter_team_leads')
      .select('msisdn')
      .eq('msisdn', msisdn)
      .maybeSingle();

    if (existing) {
      return c.json({
        error: `This MSISDN (${msisdn}) is already registered as a Promoter Team Lead.`,
      }, 409);
    }

    // Default password: bcrypt hash of "1234"
    const password_hash = await bcrypt.hash('1234', 10);

    const { error: wlError } = await supabase
      .from('promoter_team_leads')
      .insert({
        full_name:  wlData['full_name']  ?? '',
        msisdn,
        zone:       wlData['zone']       ?? '',
        se_cluster: wlData['se_cluster'] ?? '',
        password_hash,
        is_active: true,
      });

    if (wlError) {
      console.error('[Whitelist] Insert failed:', wlError);
      return c.json({ error: 'Failed to create whitelist entry. Please try again.' }, 500);
    }

    console.log(`[Whitelist] Created promoter_team_lead: ${msisdn}`);
  }
}
// ─────────────────────────────────────────────────────────────────────────────
```

- [ ] **Step 4: End-to-end verification**

1. Open a whitelist-enabled program, fill Name / MSISDN / Cluster / ZSM, submit.
2. Check `promoter_team_leads` in Supabase — the new row should appear with `is_active = true`.
3. Submit again with the same MSISDN — should receive a 409 error message in the UI.
4. Open the Promoter Team Lead login, enter the MSISDN and PIN `1234` — login should succeed.

- [ ] **Step 5: Commit**

```bash
git add src/supabase/functions/server/programs.tsx
git commit -m "feat(server): auto-create promoter_team_lead on whitelist-enabled submission"
```

---

## Done

All 6 tasks complete. The whitelist feature is live for Promoter Team Lead. Adding Airtel Champions Sales (`app_users`) as a future target requires:
1. Adding `'airtel_champions'` to the target `<select>` in Task 3
2. Adding an `else if (program.whitelist_target === 'airtel_champions')` block in Task 6
