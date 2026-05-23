// User Upload Manager - Excel Upload with Preview & Rollback
import React, { useState, useEffect } from 'react';
import { Upload, AlertTriangle, CheckCircle, Users, ArrowRight, History, X, Edit2, Save } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { parseCSV, extractUserRecords } from '../utils/csv-parser';

// Development mode detection - use localhost:3001 for local dev server
const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isDev ? 'http://localhost:3001' : `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653`;

interface UserChange {
  type: "new_user" | "removed_user" | "role_change" | "zone_transfer" | "unchanged";
  phone_number: string;
  full_name: string;
  old_data?: any;
  new_data?: any;
  points?: number;
  submissions_count?: number;
  team_members?: string[];
  team_count?: number;
  team_points?: number;
}

interface ValidationWarning {
  row: number;
  field: string;
  issue: string;
  severity: "error" | "warning";
  data?: any;
}

interface PreviewData {
  new_users: UserChange[];
  removed_users: UserChange[];
  role_changes: UserChange[];
  zone_transfers: UserChange[];
  unchanged_count: number;
}

interface MappingPreview {
  headers: string[];
  columnMapping: Record<string, string | null>;
  sourceRows: number;
  extractedUsers: number;
}

export function UserUploadManager() {
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [goingLive, setGoingLive] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [editingWarning, setEditingWarning] = useState<{ warning: ValidationWarning; value: string } | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [mappingPreview, setMappingPreview] = useState<MappingPreview | null>(null);

  useEffect(() => {
    if (isDev) {
      console.log('✅ DEV MODE: UI will return mock upload responses');
    }
    loadUploadHistory();
  }, []);

  const loadUploadHistory = async () => {
    try {
      // DEV MODE: Return mock history
      if (isDev) {
        setUploadHistory([]);
        return;
      }

      const endpoint = isDev ? `${API_BASE}/make-server-28f2f653/upload-history` : `${API_BASE}/upload-history`;
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      if (data.success) {
        setUploadHistory(data.batches || []);
      }
    } catch (error) {
      console.error("Failed to load upload history:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Read file content
      const fileContent = await file.text();
      console.log(`📄 Read file: ${file.name} (${fileContent.length} bytes)`);

      // Parse CSV/TSV
      const parseResult = parseCSV(fileContent);
      if (!parseResult.success) {
        alert(`Parse error: ${parseResult.warnings.join('\n')}`);
        setUploading(false);
        return;
      }

      console.log(`✅ Parsed ${parseResult.rows.length} contact rows`);
      console.log(`📊 Column mapping:`, parseResult.columnMapping);
      
      // Extract user records (SE, ZSM, ZBM)
      const records = extractUserRecords(parseResult.rows);
      console.log(`👥 Extracted ${records.length} user records (SE/ZSM/ZBM)`);

      setMappingPreview({
        headers: parseResult.headers,
        columnMapping: parseResult.columnMapping,
        sourceRows: parseResult.rows.length,
        extractedUsers: records.length,
      });

      // TODO: Compare with existing users to generate preview
      // For now, show all as new users
      const mockBatchId = 'batch_' + Date.now();
      const groupedByRole = {
        se: records.filter(r => r.role === 'se'),
        zsm: records.filter(r => r.role === 'zsm'),
        zbm: records.filter(r => r.role === 'zbm'),
      };

      console.log(`SE count: ${groupedByRole.se.length}, ZSM: ${groupedByRole.zsm.length}, ZBM: ${groupedByRole.zbm.length}`);

      setPreviewData({
        new_users: records.map(r => ({
          type: "new_user" as const,
          phone_number: r.phone_number,
          full_name: r.full_name,
          new_data: r,
        })),
        removed_users: [],
        role_changes: [],
        zone_transfers: [],
        unchanged_count: 0,
      });
      setBatchId(mockBatchId);
      setWarnings(parseResult.warnings.map((w, idx) => ({
        row: idx,
        field: 'parse',
        issue: w,
        severity: 'warning' as const,
      })));

      // Try to stage the parsed hierarchy on the server so the Go Live button
      // has a real batch id and staging rows to work with.
      try {
        const stageResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/upload-sales-force-contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            filename: file.name,
            records,
            warnings: parseResult.warnings,
            headers: parseResult.headers,
            source_rows: parseResult.rows.length,
          }),
        });

        const stageData = await stageResponse.json();
        if (stageResponse.ok && stageData.success) {
          setBatchId(stageData.batch_id);
          console.log(`✅ Staged ${stageData.total_users} records on server. Batch: ${stageData.batch_id}`);
        } else {
          setBatchId(mockBatchId);
          console.warn('⚠️ Server staging failed, keeping local preview only:', stageData?.error || stageResponse.statusText);
        }
      } catch (stageError: any) {
        setBatchId(mockBatchId);
        console.warn('⚠️ Unable to stage on server yet, keeping local preview only:', stageError?.message || stageError);
      }
      
      console.log(`✅ Preview ready. ${records.length} users from file.`);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFixWarning = async (warning: ValidationWarning, newValue: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/fix-warning`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            phone_number: warning.data?.phone_number,
            field: warning.field,
            value: newValue,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        // Remove warning from list
        setWarnings(warnings.filter((w) => w !== warning));
        setEditingWarning(null);
      } else {
        alert(`Fix failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleGoLive = async () => {
    if (!batchId) return;
    
    const confirm = window.confirm(
      `Are you sure you want to make these changes live?\n\n` +
      `• ${previewData?.new_users.length || 0} new users\n` +
      `• ${previewData?.removed_users.length || 0} removed users\n` +
      `• ${previewData?.role_changes.length || 0} role changes\n` +
      `• ${previewData?.zone_transfers.length || 0} zone transfers\n\n` +
      `This will update the live database.`
    );

    if (!confirm) return;

    setGoingLive(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/go-live`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ batch_id: batchId }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(`✅ Upload complete!\n\nUsers updated: ${data.users_updated}\nUsers deactivated: ${data.users_deactivated}\n\nArchive created: ${data.archive_key}`);
        
        // Reset state
        setPreviewData(null);
        setWarnings([]);
        setBatchId(null);
        loadUploadHistory();
      } else {
        alert(`Go-live failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setGoingLive(false);
    }
  };

  const handleRollback = async (archiveKey: string) => {
    const confirm = window.confirm(
      `⚠️ ROLLBACK WARNING\n\n` +
      `This will revert the database to: ${archiveKey}\n\n` +
      `All changes since this snapshot will be lost.\n\n` +
      `Continue?`
    );

    if (!confirm) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/rollback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ archive_key: archiveKey }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(`✅ Rollback complete!\n\nRestored ${data.user_count} users from ${data.archive_key}`);
        loadUploadHistory();
      } else {
        alert(`Rollback failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const hasErrors = warnings.some((w) => w.severity === "error");

  const mappingRows = mappingPreview
    ? [
        { label: 'TSESE NAME', source: mappingPreview.columnMapping.se_name, target: 'app_users.full_name', note: 'role = se' },
        { label: 'SE MSISDNS', source: mappingPreview.columnMapping.se_phone, target: 'app_users.phone_number', note: 'normalized to 254…' },
        { label: 'TERRITORY', source: mappingPreview.columnMapping.se_territory, target: 'app_users.territory', note: 'SE territory' },
        { label: 'ZSM NAME', source: mappingPreview.columnMapping.zsm_name, target: 'app_users.full_name', note: 'role = zsm' },
        { label: 'ZSM MSISDNS', source: mappingPreview.columnMapping.zsm_phone, target: 'app_users.phone_number', note: 'normalized to 254…' },
        { label: 'ZSM TERRITORY', source: mappingPreview.columnMapping.zsm_territory, target: 'app_users.territory', note: 'ZSM territory' },
        { label: 'ZBM NAME', source: mappingPreview.columnMapping.zbm_name, target: 'app_users.full_name', note: 'role = zbm' },
        { label: 'ZBM MSISDNS', source: mappingPreview.columnMapping.zbm_phone, target: 'app_users.phone_number', note: 'normalized to 254…' },
        { label: 'ZONE', source: mappingPreview.columnMapping.zone, target: 'app_users.zone', note: 'region grouping' },
      ]
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Upload Management</h1>
          <p className="text-sm opacity-70 mt-1">Upload Excel files to update organizational structure</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          <History className="w-4 h-4" />
          Upload History
        </button>
      </div>

      {/* Upload History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface)] rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">Upload History</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              {uploadHistory.length === 0 ? (
                <p className="text-center opacity-50 py-12">No upload history yet</p>
              ) : (
                <div className="space-y-3">
                  {uploadHistory.map((batch) => (
                    <div key={batch.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{batch.filename}</p>
                        <p className="text-sm opacity-70">
                          {new Date(batch.uploaded_at).toLocaleString()} • {batch.total_users} users
                        </p>
                        <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                          batch.status === 'live' ? 'bg-green-500/20 text-green-400' :
                          batch.status === 'staged' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {batch.status}
                        </span>
                      </div>
                      {batch.status === 'live' && (
                        <button
                          onClick={() => handleRollback(`archive_${batch.id}`)}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm"
                        >
                          Rollback
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {!previewData && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-8">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl p-12 cursor-pointer hover:border-white/40 transition-colors">
            <Upload className="w-12 h-12 mb-4 opacity-50" />
            <span className="text-lg font-medium mb-2">
              {uploading ? "Uploading..." : "Upload Excel File"}
            </span>
            <span className="text-sm opacity-70">
              Click to select an Excel file (.xlsx, .xls)
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm font-medium text-blue-400 mb-2">📋 Excel Format Requirements:</p>
            <ul className="text-sm opacity-80 space-y-1 ml-4">
              <li>• Required: Full Name, Phone Number, Role</li>
              <li>• Optional: Employee ID, Email, Region, Zone, ZSM, ZBM, Job Title</li>
              <li>• Phone format: +254712345678 or 0712345678</li>
            </ul>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {previewData && (
        <div className="space-y-6">
          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-[var(--color-surface)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-bold">
                  Warnings ({warnings.length})
                </h2>
              </div>
              
              {/* Debug: Show detected columns when there are many warnings */}
              {debugInfo && warnings.length > 10 && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm font-medium text-red-400 mb-2">Column Mapping Issue Detected</p>
                  <p className="text-xs opacity-80 mb-2">
                    Your Excel has these columns: <strong>{debugInfo.excel_columns?.join(', ') || 'none detected'}</strong>
                  </p>
                  <p className="text-xs opacity-60">
                    Expected: Full Name, Phone Number, Role, Region, Zone, ZSM, ZBM, Email, Employee ID, Job Title
                  </p>
                  {debugInfo.sample_row && (
                    <details className="mt-2">
                      <summary className="text-xs opacity-60 cursor-pointer hover:opacity-80">Show sample row data</summary>
                      <pre className="text-xs mt-1 p-2 bg-black/20 rounded overflow-x-auto">
                        {JSON.stringify(debugInfo.sample_row, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {warnings.map((warning, index) => (
                  <div key={index} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-yellow-400">
                          Row {warning.row}: {warning.issue}
                        </p>
                        {warning.data && (
                          <div className="mt-2 text-sm opacity-80">
                            <p>Name: {warning.data.full_name || 'N/A'}</p>
                            <p>Phone: {warning.data.phone_number || 'N/A'}</p>
                          </div>
                        )}
                        
                        {editingWarning?.warning === warning && (
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              value={editingWarning.value}
                              onChange={(e) => setEditingWarning({ ...editingWarning, value: e.target.value })}
                              placeholder={`Enter ${warning.field}`}
                              className="flex-1 px-3 py-2 bg-black/20 rounded-lg border border-white/10"
                            />
                            <button
                              onClick={() => handleFixWarning(warning, editingWarning.value)}
                              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingWarning(null)}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {!editingWarning && warning.severity === "error" && (
                        <button
                          onClick={() => setEditingWarning({ warning, value: '' })}
                          className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg flex items-center gap-2 text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                          Fix
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {mappingPreview && (
            <div className="bg-[var(--color-surface)] rounded-2xl p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold">File to DB Mapping</h2>
                  <p className="text-sm opacity-70 mt-1">
                    {mappingPreview.sourceRows} parsed source rows will create {mappingPreview.extractedUsers} app_users records.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/10 text-sm opacity-80">
                  Vacant SE rows are skipped
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mappingRows.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm opacity-70 mt-1">{item.source || 'not found'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-400">{item.target}</p>
                        <p className="text-xs opacity-60 mt-1">{item.note}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="New Users"
              value={previewData.new_users.length}
              color="green"
            />
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Removed Users"
              value={previewData.removed_users.length}
              color="red"
            />
            <StatCard
              icon={<ArrowRight className="w-5 h-5" />}
              label="Role Changes"
              value={previewData.role_changes.length}
              color="blue"
            />
            <StatCard
              icon={<ArrowRight className="w-5 h-5" />}
              label="Zone Transfers"
              value={previewData.zone_transfers.length}
              color="purple"
            />
          </div>

          {/* Changes Details */}
          <div className="space-y-4">
            {/* New Users */}
            {previewData.new_users.length > 0 && (
              <ChangeSection
                title="New Users"
                icon={<CheckCircle className="w-5 h-5 text-green-400" />}
                changes={previewData.new_users}
                renderChange={(change) => (
                  <div>
                    <p className="font-medium">{change.full_name}</p>
                    <p className="text-sm opacity-70">{change.phone_number}</p>
                    <p className="text-sm text-green-400 mt-1">
                      {change.new_data?.role} - {change.new_data?.zone}
                    </p>
                    {change.new_data?.territory && (
                      <p className="text-sm opacity-70 mt-1">
                        Territory: {change.new_data.territory}
                      </p>
                    )}
                    {change.new_data?.zsm && (
                      <p className="text-sm opacity-70 mt-1">
                        ZSM: {change.new_data.zsm}
                      </p>
                    )}
                    {change.new_data?.zbm && (
                      <p className="text-sm opacity-70 mt-1">
                        ZBM: {change.new_data.zbm}
                      </p>
                    )}
                  </div>
                )}
              />
            )}

            {/* Role Changes */}
            {previewData.role_changes.length > 0 && (
              <ChangeSection
                title="Role Changes"
                icon={<ArrowRight className="w-5 h-5 text-blue-400" />}
                changes={previewData.role_changes}
                renderChange={(change) => (
                  <div>
                    <p className="font-medium">{change.full_name}</p>
                    <p className="text-sm opacity-70">{change.phone_number}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">
                        {change.old_data?.role}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                        {change.new_data?.role}
                      </span>
                    </div>
                    {change.new_data?.role === 'ZSM' && (
                      <div className="mt-2 p-2 bg-blue-500/10 rounded text-sm">
                        <p className="text-blue-400">
                          Team: {change.team_count} SEs • Team Points: {change.team_points}
                        </p>
                        <p className="opacity-70 mt-1">
                          Personal SE points ({change.points}) will be archived
                        </p>
                      </div>
                    )}
                  </div>
                )}
              />
            )}

            {/* Zone Transfers */}
            {previewData.zone_transfers.length > 0 && (
              <ChangeSection
                title="Zone Transfers"
                icon={<ArrowRight className="w-5 h-5 text-purple-400" />}
                changes={previewData.zone_transfers}
                renderChange={(change) => (
                  <div>
                    <p className="font-medium">{change.full_name}</p>
                    <p className="text-sm opacity-70">{change.phone_number}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <span>{change.old_data?.zone}</span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="text-purple-400">{change.new_data?.zone}</span>
                    </div>
                    <p className="text-sm opacity-70 mt-1">Points: {change.points} (preserved)</p>
                  </div>
                )}
              />
            )}

            {/* Removed Users */}
            {previewData.removed_users.length > 0 && (
              <ChangeSection
                title="Removed Users (Will be deactivated)"
                icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
                changes={previewData.removed_users}
                renderChange={(change) => (
                  <div>
                    <p className="font-medium">{change.full_name}</p>
                    <p className="text-sm opacity-70">{change.phone_number}</p>
                    <p className="text-sm mt-1">
                      {change.old_data?.role} - {change.old_data?.zone}
                    </p>
                    <p className="text-sm opacity-70 mt-1">
                      {change.points} points • {change.submissions_count} submissions (preserved)
                    </p>
                  </div>
                )}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={() => {
                setPreviewData(null);
                setWarnings([]);
                setBatchId(null);
              }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGoLive}
              disabled={hasErrors || goingLive}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                hasErrors || goingLive
                  ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {goingLive ? 'Going Live...' : '✅ Go Live'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  const colorClasses = {
    green: 'bg-green-500/10 border-green-500/20',
    red: 'bg-red-500/10 border-red-500/20',
    blue: 'bg-blue-500/10 border-blue-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className={`bg-[var(--color-surface)] rounded-xl p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-70">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ChangeSection({ title, icon, changes, renderChange }: any) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-bold">{title}</h3>
          <span className="px-2 py-1 bg-white/10 rounded text-sm">{changes.length}</span>
        </div>
        <span className="text-sm opacity-50">{expanded ? '▼' : '▶'}</span>
      </button>
      
      {expanded && (
        <div className="p-4 pt-0 space-y-3 max-h-[400px] overflow-y-auto">
          {changes.map((change: UserChange, index: number) => (
            <div key={index} className="bg-white/5 rounded-lg p-4">
              {renderChange(change)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}