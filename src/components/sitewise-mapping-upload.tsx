// Sitewise Mapping Upload — patches zsm/zbm/zone in app_users without full replacement
import React, { useState } from "react";
import { Upload, AlertTriangle, CheckCircle, ArrowRight, Users, RefreshCw } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653`;

interface MappingUpdate {
  user_id: string;
  phone_number: string;
  full_name: string;
  role: string;
  old_zsm: string | null;
  new_zsm: string | null;
  old_zbm: string | null;
  new_zbm: string | null;
  old_zone: string | null;
  new_zone: string | null;
  changed: boolean;
}

interface NoMatchEntry {
  phone: string;
  name: string;
}

interface PreviewState {
  batch_id: string;
  sheet_used: string;
  total_se_in_file: number;
  updates: MappingUpdate[];
  no_match: NoMatchEntry[];
  changes_count: number;
  unchanged_count: number;
  debug: { sheets: string[]; columns: string[]; sample: any };
}

export function SitewiseMappingUpload() {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ updated: number; errors: string[] } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    e.target.value = "";
    setError(null);
    setPreview(null);
    setResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API}/upload-sitewise-mapping`, {
        method: "POST",
        headers: { Authorization: `Bearer ${publicAnonKey}` },
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Upload failed");
        if (data.debug) {
          console.warn("[SitewiseMapping] Debug info:", data.debug);
        }
        return;
      }

      setPreview(data as PreviewState);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    const ok = window.confirm(
      `Apply ${preview.changes_count} mapping update${preview.changes_count === 1 ? "" : "s"} to app_users?\n\nThis only updates zsm / zbm / zone fields — it does NOT add or remove users.`
    );
    if (!ok) return;

    setApplying(true);
    try {
      const res = await fetch(`${API}/apply-sitewise-mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ batch_id: preview.batch_id }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Apply failed");
        return;
      }

      setResult({ updated: data.updated, errors: data.errors || [] });
      setPreview(null);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setApplying(false);
    }
  };

  const changed = preview?.updates.filter((u) => u.changed) ?? [];
  const unchanged = preview?.updates.filter((u) => !u.changed) ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sitewise Mapping Update</h1>
        <p className="text-sm opacity-60 mt-1">
          Upload an .xlsb / .xlsx file to update SE → ZSM → ZBM assignments in app_users. Existing users are never removed.
        </p>
      </div>

      {/* Success result */}
      {result && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="font-semibold text-green-400">Mapping applied successfully</span>
          </div>
          <p className="text-sm">{result.updated} SE records updated.</p>
          {result.errors.length > 0 && (
            <div className="mt-3 space-y-1">
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-400">{e}</p>
              ))}
            </div>
          )}
          <button
            onClick={() => setResult(null)}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
          >
            Upload another file
          </button>
        </div>
      )}

      {/* Upload area */}
      {!preview && !result && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-8">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl p-10 cursor-pointer hover:border-white/40 transition-colors">
            {loading ? (
              <>
                <RefreshCw className="w-10 h-10 mb-3 opacity-50 animate-spin" />
                <span className="font-medium">Parsing file…</span>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 mb-3 opacity-50" />
                <span className="font-medium mb-1">Upload Sitewise & Contacts Excel</span>
                <span className="text-sm opacity-60">.xlsb or .xlsx accepted</span>
              </>
            )}
            <input
              type="file"
              accept=".xlsb,.xlsx,.xls"
              onChange={handleFile}
              disabled={loading}
              className="hidden"
            />
          </label>

          <div className="mt-5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
            <p className="font-medium text-blue-400 mb-2">Expected columns in the contacts sheet:</p>
            <div className="grid grid-cols-2 gap-1 opacity-80">
              <span>SE NAME / TSESE NAME</span><span className="text-green-400">→ match key (name display)</span>
              <span>SE MSISDNS</span><span className="text-green-400">→ lookup key (phone)</span>
              <span>ZSM NAME</span><span className="text-green-400">→ app_users.zsm</span>
              <span>ZBM NAME</span><span className="text-green-400">→ app_users.zbm</span>
              <span>ZONE</span><span className="text-green-400">→ app_users.zone</span>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-400">Upload error</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-3 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="SE in file" value={preview.total_se_in_file} color="blue" />
            <SummaryCard label="Will change" value={preview.changes_count} color="yellow" />
            <SummaryCard label="Already correct" value={preview.unchanged_count} color="green" />
            <SummaryCard label="Not in DB" value={preview.no_match.length} color="red" />
          </div>

          {/* Sheet info */}
          <div className="bg-white/5 rounded-xl px-4 py-3 text-sm opacity-70">
            Sheet used: <strong>{preview.sheet_used}</strong> &nbsp;·&nbsp;
            Available sheets: {preview.debug.sheets.join(", ")}
          </div>

          {/* Changes table */}
          {changed.length > 0 && (
            <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
                <ArrowRight className="w-4 h-4 text-yellow-400" />
                <h2 className="font-semibold">Mapping changes ({changed.length})</h2>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[var(--color-surface)] border-b border-white/10">
                    <tr className="text-left">
                      <th className="px-4 py-2 opacity-60 font-normal">SE Name</th>
                      <th className="px-4 py-2 opacity-60 font-normal">Phone</th>
                      <th className="px-4 py-2 opacity-60 font-normal">ZSM</th>
                      <th className="px-4 py-2 opacity-60 font-normal">ZBM</th>
                      <th className="px-4 py-2 opacity-60 font-normal">Zone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changed.map((u, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-2">{u.full_name}</td>
                        <td className="px-4 py-2 opacity-60">{u.phone_number}</td>
                        <td className="px-4 py-2">
                          <DiffCell old={u.old_zsm} next={u.new_zsm} />
                        </td>
                        <td className="px-4 py-2">
                          <DiffCell old={u.old_zbm} next={u.new_zbm} />
                        </td>
                        <td className="px-4 py-2">
                          <DiffCell old={u.old_zone} next={u.new_zone} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No-match list */}
          {preview.no_match.length > 0 && (
            <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
                <Users className="w-4 h-4 text-red-400" />
                <h2 className="font-semibold">Not found in app_users ({preview.no_match.length})</h2>
                <span className="text-xs opacity-50">These SEs are in the Excel but not in the DB — they won't be created</span>
              </div>
              <div className="p-4 max-h-[200px] overflow-y-auto">
                <div className="space-y-1">
                  {preview.no_match.map((n, i) => (
                    <p key={i} className="text-sm opacity-70">{n.name} — {n.phone}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => { setPreview(null); setError(null); }}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={applying || preview.changes_count === 0}
              className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                applying || preview.changes_count === 0
                  ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                  : "bg-yellow-500 hover:bg-yellow-400 text-black"
              }`}
            >
              {applying ? "Applying…" : `Apply ${preview.changes_count} change${preview.changes_count === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/20",
    yellow: "bg-yellow-500/10 border-yellow-500/20",
    green: "bg-green-500/10 border-green-500/20",
    red: "bg-red-500/10 border-red-500/20",
  };
  return (
    <div className={`rounded-xl p-4 border ${colors[color] ?? colors.blue}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-60 mt-1">{label}</p>
    </div>
  );
}

function DiffCell({ old: oldVal, next: newVal }: { old: string | null; next: string | null }) {
  const same = oldVal === newVal;
  if (same) return <span className="opacity-40">{oldVal ?? "—"}</span>;
  return (
    <span className="flex items-center gap-1 flex-wrap">
      {oldVal ? <span className="line-through opacity-40 text-xs">{oldVal}</span> : <span className="opacity-30 text-xs">—</span>}
      <ArrowRight className="w-3 h-3 text-yellow-400 shrink-0" />
      <span className="text-yellow-300">{newVal ?? "—"}</span>
    </span>
  );
}
