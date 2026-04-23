// src/components/hbb/hbb-ga-upload-manager.tsx
// GA Upload Manager - For HQ to upload monthly DSE/Installer GA reports
// Provides: Upload → Preview → Validate → Fix Warnings → Go Live → Rollback

import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, ChevronRight, Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  uploadGAReport,
  validateGAReport,
  goLiveGAReport,
  rollbackGAReport,
  getUploadHistory,
  UploadBatch,
} from './hbb-ga-api';
import { normalizePhone, GAUploadError } from './hbb-ga-utilities';

export function HBBGAUploadManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStep, setUploadStep] = useState<'select' | 'preview' | 'validate' | 'live' | 'history'>('select');
  const [reportType, setReportType] = useState<'dse_ga' | 'installer_ga'>('dse_ga');
  const [tableSource, setTableSource] = useState('HBB_DSE_APRIL');
  const [batchId, setBatchId] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadBatch[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Handle file selection and upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await uploadGAReport(file, reportType, tableSource);
      setBatchId(result.batchId);
      setPreview(result.preview);
      setWarnings(result.warnings);
      setUploadStep('preview');
      toast.success(`${result.totalRecords} records uploaded for preview`);
    } catch (error) {
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Validate the report
  const handleValidate = async () => {
    if (!batchId) return;
    
    setLoading(true);
    try {
      const result = await validateGAReport(batchId);
      setValidationResult(result);
      setUploadStep('validate');
      
      if (result.isValid) {
        toast.success('Validation passed! Ready to go live.');
      } else {
        toast.warning(`Validation found ${result.errorCount} errors and ${result.warningCount} warnings`);
      }
    } catch (error) {
      toast.error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Go live with the report
  const handleGoLive = async () => {
    if (!batchId) return;
    
    setLoading(true);
    try {
      const result = await goLiveGAReport(batchId);
      toast.success(`${result.recordsCreated} records created, ${result.recordsUpdated} updated`);
      setUploadStep('live');
      // Send notification to all users
      await sendUploadNotification(batchId, reportType, result.recordsCreated + result.recordsUpdated);
    } catch (error) {
      toast.error(`Go-live failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Rollback the report
  const handleRollback = async (reason: string) => {
    if (!batchId) return;
    
    setLoading(true);
    try {
      await rollbackGAReport(batchId, reason);
      toast.success('Report rolled back successfully');
      setUploadStep('history');
    } catch (error) {
      toast.error(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Load upload history
  const handleViewHistory = async () => {
    setLoading(true);
    try {
      const history = await getUploadHistory(reportType);
      setUploadHistory(history);
      setUploadStep('history');
    } catch (error) {
      toast.error(`Failed to load history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">GA Report Upload Manager</h1>
        <p className="text-gray-600 mb-6">Upload DSE and Installer Gross Add reports. Stage → Validate → Go Live → Monitor</p>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-between">
          {['select', 'preview', 'validate', 'live'].map((step, idx) => (
            <React.Fragment key={step}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                uploadStep === step ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {idx + 1}
              </div>
              {idx < 3 && (
                <div className={`flex-1 h-1 mx-2 ${uploadStep > step ? 'bg-red-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1: SELECT & UPLOAD */}
        {uploadStep === 'select' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-6">1. Select Report Type & Upload File</h2>
            
            <div className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Report Type</label>
                <div className="flex gap-4">
                  {[
                    { value: 'dse_ga', label: 'DSE GA Report' },
                    { value: 'installer_ga', label: 'Installer GA Report' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setReportType(option.value as any)}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition ${
                        reportType === option.value
                          ? 'border-red-600 bg-red-50 text-red-600'
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Source */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Table Source</label>
                <input
                  type="text"
                  value={tableSource}
                  onChange={(e) => setTableSource(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., HBB_DSE_APRIL"
                />
                <p className="text-xs text-gray-500 mt-1">Change if uploading to a different month's source table</p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Upload Excel File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-red-600 hover:bg-red-50 transition"
                >
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="font-medium text-gray-700">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">CSV, XLS, or XLSX files. Columns: Phone | Name | GA Count</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <button
                onClick={handleViewHistory}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                View Upload History <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {uploadStep === 'preview' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-6">2. Review Preview & Warnings</h2>
            
            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-900">{warnings.length} Issues Found</h3>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {warnings.map((w, idx) => (
                    <div key={idx} className="text-sm text-yellow-800">
                      <strong>Row {w.row}:</strong> {w.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-2 text-left font-semibold">Name</th>
                    <th className="px-4 py-2 text-left font-semibold">Phone</th>
                    <th className="px-4 py-2 text-right font-semibold">GA Count</th>
                    <th className="px-4 py-2 text-left font-semibold">Town</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((record, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-2">{record.name}</td>
                      <td className="px-4 py-2 font-mono text-xs">{normalizePhone(record.phone)}</td>
                      <td className="px-4 py-2 text-right font-medium">{record.gaCount}</td>
                      <td className="px-4 py-2">{record.town || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 10 && (
                <p className="text-sm text-gray-600 mt-2">... and {preview.length - 10} more records</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setUploadStep('select')}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleValidate}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Validating...' : 'Validate'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: VALIDATE */}
        {uploadStep === 'validate' && validationResult && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-6">3. Validation Results</h2>
            
            {validationResult.isValid ? (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <p className="text-green-900 font-medium">All validations passed! Ready to go live.</p>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">
                    {validationResult.errorCount} errors, {validationResult.warningCount} warnings
                  </h3>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setUploadStep('preview')}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleGoLive}
                disabled={!validationResult.isValid || loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Going Live...' : 'Go Live'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: LIVE */}
        {uploadStep === 'live' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Report Live!</h2>
              <p className="text-gray-600">GA data has been applied to the system. Notifications have been sent.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700">
                <strong>Batch ID:</strong> {batchId}
              </p>
            </div>

            <button
              onClick={() => setUploadStep('history')}
              className="w-full px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
            >
              View Upload History
            </button>
          </div>
        )}

        {/* HISTORY VIEW */}
        {uploadStep === 'history' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-6">Upload History</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {uploadHistory.map(batch => (
                <div key={batch.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{batch.filename}</p>
                      <p className="text-xs text-gray-500">{new Date(batch.uploadedAt).toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      batch.status === 'live' ? 'bg-green-100 text-green-700' :
                      batch.status === 'rolled_back' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {batch.status === 'live' ? '✓ Live' : batch.status === 'rolled_back' ? '✕ Rolled Back' : 'Staged'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{batch.totalRecords} records • {batch.warningsCount} warnings</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setUploadStep('select')}
              className="mt-6 w-full px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              New Upload
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Placeholder for notification function (to be integrated with your notification system)
async function sendUploadNotification(batchId: string, reportType: string, totalRecords: number) {
  console.log(`Notification: GA report uploaded - ${totalRecords} records`);
}
