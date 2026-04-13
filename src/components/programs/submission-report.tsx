/**
 * Submission Report — Steve Jobs-inspired "Simplicity is the ultimate sophistication"
 *
 * A clean, typographic report that agents can download as PDF.
 * Uses Airtel red as the accent color with a refined, minimal aesthetic.
 * PDF is generated via html2canvas + jsPDF on a clean iframe (no oklch/Tailwind colors).
 */
import { useState, useRef } from 'react';
import { X, Download, FileText, MapPin, Clock, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react';
import type { SubmissionDetails } from './submit-handler';

interface SubmissionReportProps {
  details: SubmissionDetails;
  pointsEarned: number;
  newTotalPoints: number;
  onClose: () => void;
}

export function SubmissionReport({ details, pointsEarned, newTotalPoints, onClose }: SubmissionReportProps) {
  const [showAllFields, setShowAllFields] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // ─── Derived values ────────────────────────────────────────────────────────
  const linkedMSISDNs: any[] = details.linkedMSISDNs ?? [];
  const hasOdometer = details.morningOdometer !== null && details.morningOdometer !== undefined;
  const hasLinkedData = linkedMSISDNs.length > 0;

  // ─── Format helpers ────────────────────────────────────────────────────────
  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '—';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const getFormRows = (): { label: string; value: string; type: string }[] => {
    const rows: { label: string; value: string; type: string }[] = [];
    if (!details.fields || !details.formData) return rows;
    for (const field of details.fields) {
      const value = details.formData[field.id];
      if (value === undefined || value === null || value === '') continue;
      if (field.field_type === 'photo' || field.field_type === 'photo_upload') {
        rows.push({ label: field.field_label, value: `${Array.isArray(value) ? value.length : 1} photo(s) attached`, type: 'photo' });
        continue;
      }
      rows.push({ label: field.field_label || field.field_name || field.id, value: formatValue(value), type: field.field_type });
    }
    return rows;
  };

  const formRows = getFormRows();
  const visibleRows = showAllFields ? formRows : formRows.slice(0, 6);

  // ─── Build clean PDF HTML (hex/rgb only — no Tailwind/oklch) ──────────────
  const buildPDFHtml = (): string => {
    const allRows = getFormRows();
    const eveningOdo: number | null = (details as any).eveningOdometer ?? (details as any).inlineOdometer ?? null;
    const distance: number | null = hasOdometer && eveningOdo !== null ? eveningOdo - (details.morningOdometer as number) : null;
    const hasSiteCol = linkedMSISDNs.some((m: any) => m.site_name);
    const totalGAs = linkedMSISDNs.reduce((s: number, m: any) => s + (parseInt(m.ga_done) || 0), 0);

    const metaCards = [
      { label: 'Date', value: details.submissionDate ?? '' },
      { label: 'Time', value: details.submissionTime ?? '' },
      ...(details.userName ? [{ label: 'Agent', value: details.userName }] : []),
      ...(details.shopName ? [{ label: 'Location', value: details.shopName }] : []),
    ];

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Submission Report</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif; color:#1a1a1a; background:#fff; padding:32px; line-height:1.5; font-size:14px; }
.accent-bar { height:6px; background:linear-gradient(90deg,#cc0000,#e60000,#cc0000); }
.header { text-align:center; padding:24px 24px 20px; border-bottom:1px solid #f0f0f0; }
.brand { font-size:10px; letter-spacing:4px; text-transform:uppercase; color:#e60000; font-weight:700; margin-bottom:4px; }
.title { font-size:24px; font-weight:800; color:#111; letter-spacing:-0.5px; }
.subtitle { font-size:13px; color:#666; margin-top:4px; }
.report-id { font-size:10px; color:#aaa; font-family:monospace; margin-top:8px; }
.meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:20px 24px; }
.meta-card { background:#f9f9f9; border:1px solid #ebebeb; border-radius:10px; padding:12px 14px; }
.meta-label { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#aaa; font-weight:600; margin-bottom:3px; }
.meta-value { font-size:14px; font-weight:600; color:#1a1a1a; }
.gps { margin:0 24px 16px; background:#f9f9f9; border:1px solid #ebebeb; border-radius:10px; padding:10px 14px; font-size:12px; color:#666; font-family:monospace; }
.divider { height:1px; background:#f0f0f0; margin:0 24px; }
.section { padding:16px 24px; }
.section-label { font-size:9px; letter-spacing:3px; text-transform:uppercase; color:#e60000; font-weight:700; margin-bottom:12px; }
.odo-bar { display:flex; border-radius:10px; overflow:hidden; border:1px solid #e0e0e0; }
.odo-cell { flex:1; padding:14px; text-align:center; }
.odo-cell.start { background:#f9f9f9; }
.odo-cell.end { background:#f5f5f5; }
.odo-cell.dist { background:#1a1a1a; }
.odo-lbl { font-size:9px; letter-spacing:1.5px; text-transform:uppercase; font-weight:600; color:#aaa; margin-bottom:4px; }
.odo-cell.dist .odo-lbl { color:rgba(255,255,255,0.5); }
.odo-val { font-size:20px; font-weight:800; color:#1a1a1a; }
.odo-cell.dist .odo-val { color:#fff; }
.odo-sep { width:1px; background:#e0e0e0; }
.table-wrap { border:1px solid #e0e0e0; border-radius:10px; overflow:hidden; }
table { width:100%; border-collapse:collapse; }
thead tr.red-head { background:#e60000; }
thead tr.gray-head { background:#f5f5f5; }
thead th { text-align:left; font-size:9px; letter-spacing:1.5px; text-transform:uppercase; font-weight:600; padding:9px 12px; }
.red-head th { color:rgba(255,255,255,0.9); }
.gray-head th { color:#999; }
thead th.right { text-align:right; }
tbody tr:nth-child(even) { background:#fafafa; }
tbody tr:nth-child(odd) { background:#fff; }
tbody td { padding:9px 12px; font-size:13px; border-bottom:1px solid #f5f5f5; color:#1a1a1a; }
tbody td.muted { color:#666; }
tbody td.mono { font-family:monospace; font-weight:600; }
tbody td.right { text-align:right; font-weight:700; color:#e60000; }
tbody td.label { color:#666; font-weight:500; width:40%; }
tbody td.val { font-weight:600; }
tr.total-row { border-top:2px solid #e0e0e0; background:#f5f5f5; }
tr.total-row td { font-weight:700; font-size:13px; }
.points-box { background:#fff5f5; border:2px solid #fecaca; border-radius:14px; padding:20px; text-align:center; }
.points-lbl { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#aaa; font-weight:600; margin-bottom:4px; }
.points-num { font-size:36px; font-weight:900; color:#e60000; line-height:1; }
.points-divider { height:1px; background:#fecaca; margin:12px 40px; }
.points-total { font-size:12px; color:#666; }
.points-total strong { color:#1a1a1a; font-size:14px; }
.photos-box { display:flex; align-items:center; gap:12px; background:#f9f9f9; border:1px solid #ebebeb; border-radius:10px; padding:12px 14px; }
.photos-icon { width:32px; height:32px; background:#fde8e8; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
.photos-title { font-size:12px; font-weight:600; color:#1a1a1a; }
.photos-sub { font-size:10px; color:#aaa; }
.footer { text-align:center; padding:16px 24px; border-top:1px solid #f0f0f0; margin-top:8px; }
.footer-text { font-size:10px; color:#aaa; }
.footer-brand { color:#e60000; font-weight:700; }
</style>
</head>
<body>
<div class="accent-bar"></div>
<div class="header">
  <div class="brand">Airtel Champions</div>
  <div class="title">Submission Report</div>
  <div class="subtitle">${details.programTitle ?? ''}</div>
  <div class="report-id">ID: ${(details.submissionId ?? '').slice(0, 8)}...${(details.submissionId ?? '').slice(-4)}</div>
</div>
<div class="meta-grid">
  ${metaCards.map(c => `<div class="meta-card"><div class="meta-label">${c.label}</div><div class="meta-value">${c.value || '—'}</div></div>`).join('')}
</div>
${details.location ? `<div class="gps">&#128205; ${details.location.lat.toFixed(6)}, ${details.location.lng.toFixed(6)}</div>` : ''}
<div class="divider"></div>
${hasOdometer ? `
<div class="section">
  <div class="section-label">Odometer Tracker</div>
  <div class="odo-bar">
    <div class="odo-cell start"><div class="odo-lbl">Morning</div><div class="odo-val">${(details.morningOdometer as number).toLocaleString()}</div></div>
    <div class="odo-sep"></div>
    <div class="odo-cell end"><div class="odo-lbl">Evening</div><div class="odo-val">${eveningOdo !== null ? eveningOdo.toLocaleString() : '—'}</div></div>
    <div class="odo-sep"></div>
    <div class="odo-cell dist"><div class="odo-lbl">Distance</div><div class="odo-val">${distance !== null && distance >= 0 ? distance.toLocaleString() + ' km' : '—'}</div></div>
  </div>
</div>
<div class="divider"></div>` : ''}
${hasLinkedData ? `
<div class="section">
  <div class="section-label">Promoters (${linkedMSISDNs.length})</div>
  <div class="table-wrap">
    <table>
      <thead><tr class="red-head">
        <th>#</th><th>MSISDN</th>${hasSiteCol ? '<th>Site</th>' : ''}<th class="right">GAs</th>
      </tr></thead>
      <tbody>
        ${linkedMSISDNs.map((m: any, i: number) => `<tr>
          <td class="muted">${i + 1}</td>
          <td class="mono">${m.msisdn}</td>
          ${hasSiteCol ? `<td class="muted">${m.site_name || '—'}</td>` : ''}
          <td class="right">${m.ga_done || 0}</td>
        </tr>`).join('')}
        <tr class="total-row">
          <td colspan="${hasSiteCol ? 3 : 2}" style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#555;padding:9px 12px;">Total GAs</td>
          <td class="right" style="padding:9px 12px;">${totalGAs}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
<div class="divider"></div>` : ''}
${allRows.length > 0 ? `
<div class="section">
  <div class="section-label">Submission Details</div>
  <div class="table-wrap">
    <table>
      <thead><tr class="gray-head"><th>Field</th><th>Value</th></tr></thead>
      <tbody>
        ${allRows.map(row => `<tr><td class="label">${row.label}</td><td class="val">${row.value}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>
<div class="divider"></div>` : ''}
${pointsEarned > 0 ? `
<div class="section">
  <div class="points-box">
    <div class="points-lbl">Points Earned</div>
    <div class="points-num">+${pointsEarned}</div>
    <div class="points-divider"></div>
    <div class="points-total">New Total: <strong>${newTotalPoints.toLocaleString()} pts</strong></div>
  </div>
</div>` : ''}
${details.photosCount > 0 ? `
<div class="section" style="padding-top:0">
  <div class="photos-box">
    <div class="photos-icon">&#128247;</div>
    <div>
      <div class="photos-title">${details.photosCount} Photo${details.photosCount > 1 ? 's' : ''} Attached</div>
      <div class="photos-sub">Saved with submission</div>
    </div>
  </div>
</div>` : ''}
<div class="footer">
  <div class="footer-text">Generated by <span class="footer-brand">Airtel Champions</span> &bull; ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  <div class="footer-text" style="margin-top:2px;color:#ccc;">This is an official submission record</div>
</div>
</body>
</html>`;
  };

  // ─── PDF Download ──────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const htmlContent = buildPDFHtml();

      // Render into a hidden iframe so html2canvas never touches Tailwind's oklch colors
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;height:auto;border:none;visibility:hidden;';
      document.body.appendChild(iframe);

      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        iframe.srcdoc = htmlContent;
      });

      // Allow fonts to render
      await new Promise(r => setTimeout(r, 400));

      const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Could not access iframe document');

      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
      });

      document.body.removeChild(iframe);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeName = (details.programTitle ?? 'Report').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '');
      const safeDate = (details.submissionDate ?? '').replace(/\//g, '-');
      pdf.save(`Airtel-Champions_${safeName}_${safeDate}.pdf`);
    } catch (err) {
      console.error('[SubmissionReport] PDF generation failed:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ─── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[60] overflow-y-auto">
      <div className="w-full max-w-lg mx-4 my-6">

        {/* Toolbar */}
        <div className="flex items-center mb-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Report Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div ref={reportRef}>

            {/* Header */}
            <div className="relative">
              <div className="h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-red-600"></div>
              <div className="px-6 pt-6 pb-5 text-center">
                <p className="text-[10px] font-bold tracking-[4px] uppercase text-red-600 mb-1">
                  Airtel Champions
                </p>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  Submission Report
                </h1>
                <p className="text-sm text-gray-500 mt-1 font-medium">{details.programTitle}</p>
                <p className="text-[10px] text-gray-400 font-mono mt-2">
                  ID: {details.submissionId?.slice(0, 8)}...{details.submissionId?.slice(-4)}
                </p>
              </div>
            </div>

            {/* Meta Grid */}
            <div className="px-6 pb-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-[9px] font-semibold tracking-[2px] uppercase text-gray-400">Date</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{details.submissionDate}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-[9px] font-semibold tracking-[2px] uppercase text-gray-400">Time</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{details.submissionTime}</p>
                </div>
                {details.userName && (
                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-[9px] font-semibold tracking-[2px] uppercase text-gray-400">Agent</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{details.userName}</p>
                  </div>
                )}
                {details.shopName && (
                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-[9px] font-semibold tracking-[2px] uppercase text-gray-400">Location</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{details.shopName}</p>
                  </div>
                )}
              </div>
              {details.location && (
                <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <span className="text-xs text-gray-500 font-mono">
                    {details.location.lat.toFixed(6)}, {details.location.lng.toFixed(6)}
                  </span>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100 mx-6"></div>

            {/* Odometer */}
            {hasOdometer && (
              <div className="px-6 pt-5 pb-4">
                <p className="text-[9px] font-bold tracking-[3px] uppercase text-red-600 mb-3">Odometer Tracker</p>
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  <div className="flex-1 bg-gray-50 p-3.5 text-center">
                    <p className="text-[9px] font-semibold tracking-[1.5px] uppercase text-gray-400 mb-1">Morning</p>
                    <p className="text-lg font-extrabold text-gray-900">{details.morningOdometer?.toLocaleString() || '—'}</p>
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div className="flex-1 bg-gray-50 p-3.5 text-center">
                    <p className="text-[9px] font-semibold tracking-[1.5px] uppercase text-gray-400 mb-1">Evening</p>
                    <p className="text-lg font-extrabold text-gray-900">{(details as any).eveningOdometer?.toLocaleString() || '—'}</p>
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div className="flex-1 bg-gray-900 p-3.5 text-center">
                    <p className="text-[9px] font-semibold tracking-[1.5px] uppercase text-gray-400 mb-1">Distance</p>
                    <p className="text-lg font-extrabold text-white">
                      {(details as any).distanceCovered != null
                        ? `${(details as any).distanceCovered.toLocaleString()} km`
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Promoters Table */}
            {hasLinkedData && (
              <div className="px-6 pt-4 pb-4">
                <p className="text-[9px] font-bold tracking-[3px] uppercase text-red-600 mb-3">
                  Promoters ({linkedMSISDNs.length})
                </p>
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-red-600 to-red-500">
                        <th className="text-left text-[9px] font-semibold tracking-[1.5px] uppercase text-white/90 py-2.5 px-3">#</th>
                        <th className="text-left text-[9px] font-semibold tracking-[1.5px] uppercase text-white/90 py-2.5 px-3">MSISDN</th>
                        {linkedMSISDNs.some((m: any) => m.site_name) && (
                          <th className="text-left text-[9px] font-semibold tracking-[1.5px] uppercase text-white/90 py-2.5 px-3">Site</th>
                        )}
                        <th className="text-right text-[9px] font-semibold tracking-[1.5px] uppercase text-white/90 py-2.5 px-3">GAs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedMSISDNs.map((m: any, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-2.5 px-3 text-xs text-gray-400 font-medium">{i + 1}</td>
                          <td className="py-2.5 px-3 text-sm font-semibold text-gray-900 font-mono">{m.msisdn}</td>
                          {linkedMSISDNs.some((x: any) => x.site_name) && (
                            <td className="py-2.5 px-3 text-xs text-gray-600">{m.site_name || '—'}</td>
                          )}
                          <td className="py-2.5 px-3 text-sm font-bold text-right text-red-600">{m.ga_done || 0}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-200 bg-gray-50">
                        <td colSpan={linkedMSISDNs.some((m: any) => m.site_name) ? 3 : 2}
                          className="py-2.5 px-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Total GAs</td>
                        <td className="py-2.5 px-3 text-sm font-extrabold text-right text-red-600">
                          {linkedMSISDNs.reduce((sum: number, m: any) => sum + (parseInt(m.ga_done) || 0), 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Form Fields */}
            {formRows.length > 0 && (
              <div className="px-6 pt-4 pb-4">
                <p className="text-[9px] font-bold tracking-[3px] uppercase text-red-600 mb-3">Submission Details</p>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-[9px] font-semibold tracking-[1.5px] uppercase text-gray-400 py-2.5 px-3 border-b border-gray-200">Field</th>
                        <th className="text-left text-[9px] font-semibold tracking-[1.5px] uppercase text-gray-400 py-2.5 px-3 border-b border-gray-200">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="py-2.5 px-3 text-xs text-gray-500 font-medium w-2/5 align-top">{row.label}</td>
                          <td className="py-2.5 px-3 text-sm font-semibold text-gray-900 break-words">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {formRows.length > 6 && (
                    <button
                      onClick={() => setShowAllFields(!showAllFields)}
                      className="w-full py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1 border-t border-gray-200"
                    >
                      {showAllFields
                        ? <><span>Show Less</span> <ChevronUp className="w-3.5 h-3.5" /></>
                        : <><span>Show All {formRows.length} Fields</span> <ChevronDown className="w-3.5 h-3.5" /></>}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Points Badge */}
            {pointsEarned > 0 && (
              <div className="px-6 pt-2 pb-5">
                <div className="bg-gradient-to-br from-red-50 via-white to-red-50 border-2 border-red-100 rounded-2xl p-5 text-center">
                  <p className="text-[9px] font-bold tracking-[3px] uppercase text-gray-400 mb-1">Points Earned</p>
                  <p className="text-4xl font-black text-red-600 leading-none">+{pointsEarned}</p>
                  <div className="h-px bg-red-100 my-3 mx-8"></div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-gray-400 font-medium">New Total:</span>
                    <span className="text-sm font-bold text-gray-900">{newTotalPoints.toLocaleString()} pts</span>
                  </div>
                </div>
              </div>
            )}

            {/* Photos */}
            {details.photosCount > 0 && (
              <div className="px-6 pb-5">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{details.photosCount} Photo{details.photosCount > 1 ? 's' : ''} Attached</p>
                    <p className="text-[10px] text-gray-400">Saved with submission</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400">
                Generated by <span className="font-bold text-red-600">Airtel Champions</span> &bull;{' '}
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-[9px] text-gray-300 mt-0.5">This is an official submission record</p>
            </div>
          </div>
        </div>

        {/* Single bottom Download button */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3.5 bg-white text-gray-700 rounded-xl font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
