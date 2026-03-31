import React, { useState, useEffect } from 'react';
import { getReports, generateReport } from '../services/apiService';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './ReportsPage.css';

function downloadAsPDF(report) {
  const reportDate = report.date
    ? new Date(report.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const periodFrom = report.fromDate
    ? new Date(report.fromDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const periodTo = report.toDate
    ? new Date(report.toDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const period = periodFrom && periodTo ? `${periodFrom} \u2014 ${periodTo}` : reportDate;

  function formatReportHTML(text) {
    if (!text) return '';
    const lines = text.split('\n');
    let html = '';
    let inList = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<br>';
        continue;
      }

      // Remove any remaining ** markdown
      const clean = trimmed.replace(/\*\*/g, '').replace(/\*/g, '');

      // Section headings (ALL CAPS lines)
      if (clean === clean.toUpperCase() && clean.length > 3 && !clean.startsWith('-')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<div class="section-title">${clean}</div>`;
        continue;
      }

      // Bullet points
      if (clean.startsWith('- ') || clean.startsWith('• ')) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += `<li>${clean.slice(2)}</li>`;
        continue;
      }

      // Regular paragraph
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${clean}</p>`;
    }

    if (inList) html += '</ul>';
    return html;
  }

  const formattedSummary = formatReportHTML(report.summary);
  const symptomBanner = report.symptomCount !== undefined
    ? `<div class="symptom-count">Based on <strong>${report.symptomCount} symptom log${report.symptomCount !== 1 ? 's' : ''}</strong> recorded during this period</div>`
    : '';

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>SheHealth Health Report - ${reportDate}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; max-width: 750px; margin: 0 auto; padding: 40px 30px; color: #2D1B2E; line-height: 1.8; font-size: 14px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #E8526A; padding-bottom: 20px; margin-bottom: 30px; }
    .logo-section { display: flex; align-items: center; gap: 12px; }
    .logo-text { font-size: 22px; font-weight: bold; color: #E8526A; }
    .logo-sub { font-size: 11px; color: #6B4C5E; margin-top: 2px; }
    .report-meta { text-align: right; }
    .report-meta .label { font-size: 11px; color: #B08090; text-transform: uppercase; letter-spacing: 0.5px; }
    .report-meta .value { font-size: 13px; color: #2D1B2E; font-weight: 600; }
    .ai-badge { display: inline-block; background: #FFF0F5; color: #E8526A; border: 1px solid #E8526A; border-radius: 20px; padding: 3px 12px; font-size: 11px; font-weight: 600; margin-top: 6px; }
    ul { margin: 8px 0 12px 20px; padding: 0; }
    li { margin-bottom: 6px; line-height: 1.7; }
    p { margin: 0 0 10px 0; }
    .section-title { font-size: 15px; font-weight: bold; color: #1B4B5A; margin: 24px 0 10px; padding-bottom: 5px; border-bottom: 1px solid #FFE8EE; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { font-size: 14px; line-height: 1.9; color: #2D1B2E; }
    .symptom-count { background: #FFF0F5; border-left: 4px solid #E8526A; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px; font-size: 13px; color: #6B4C5E; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #FFE8EE; font-size: 11px; color: #B08090; text-align: center; line-height: 1.6; }
    .footer strong { color: #E8526A; }
    @media print { body { padding: 20px; } .header { page-break-after: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <img src="${window.location.origin}/logo.png" alt="SheHealth" style="width:56px;height:56px;object-fit:contain;" onerror="this.style.display='none'" />
      <div>
        <div class="logo-text">SheHealth</div>
        <div class="logo-sub">Women's Health AI Assistant</div>
      </div>
    </div>
    <div class="report-meta">
      <div class="label">Report Generated</div>
      <div class="value">${reportDate}</div>
      <div class="label" style="margin-top:6px">Symptom Period</div>
      <div class="value">${period}</div>
      <div><span class="ai-badge">AI Generated Report</span></div>
    </div>
  </div>
  ${symptomBanner}
  <div class="section-title">Patient Health Summary</div>
  <div class="content">${formattedSummary}</div>
  <div class="footer">
    <strong>AI-Generated Medical Report - For Doctor Review Only</strong><br>
    This report was automatically generated by SheHealth AI Assistant using patient-reported symptom data.<br>
    It is intended to assist healthcare professionals and should not replace clinical diagnosis or professional medical advice.<br>
    Always consult a qualified doctor for medical decisions.<br><br>
    Generated by SheHealth AI - Confidential Patient Health Information
  </div>
</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); }, 600);
}

function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [genError, setGenError] = useState('');
  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);

  useEffect(() => {
    getReports()
      .then((res) => setReports(res.data || []))
      .catch(() => setError("We couldn't load your reports. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setGenError('');
    setGenerating(true);
    try {
      const res = await generateReport(fromDate, toDate);
      const newReport = res.data;
      setReports((prev) => [{
        reportId: newReport.reportId,
        date: newReport.date,
        summary: newReport.summary,
        fromDate: newReport.fromDate,
        toDate: newReport.toDate,
        symptomCount: newReport.symptomCount,
        downloadUrl: '',
      }, ...prev]);
    } catch (err) {
      setGenError('Something went wrong generating your report. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="reports-page">
      <Navbar />
      <div className="page-container reports-container">
        <div className="reports-header">
          <div>
            <h1 className="reports-heading">Health Reports</h1>
            <p className="reports-subheading">{reports.length} report{reports.length !== 1 ? 's' : ''} generated</p>
          </div>
        </div>

        <div className="card reports-generate-card">
          <h3 className="reports-generate-card__title">Generate New Report</h3>
          <p className="reports-generate-card__desc">Select a date range to generate an AI health report from your symptom logs</p>
          <div className="reports-date-row">
            <div className="reports-date-field">
              <label className="auth-card__label" htmlFor="fromDate">From Date</label>
              <input
                id="fromDate"
                type="date"
                className="input-field"
                value={fromDate}
                max={toDate}
                onChange={e => setFromDate(e.target.value)}
              />
            </div>
            <div className="reports-date-field">
              <label className="auth-card__label" htmlFor="toDate">To Date</label>
              <input
                id="toDate"
                type="date"
                className="input-field"
                value={toDate}
                max={today}
                onChange={e => setToDate(e.target.value)}
              />
            </div>
            <button
              className={generating ? 'btn-disabled' : 'btn-primary'}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
          {genError && <ErrorMessage message={genError} />}
          {generating && (
            <div className="reports-generating">
              <LoadingSpinner />
              <p className="reports-generating__text">SheHealth AI is analyzing your symptoms and generating a detailed report...</p>
            </div>
          )}
        </div>

        {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : (
          reports.length === 0 ? (
            <div className="reports-empty">
              <div className="reports-empty__icon" aria-hidden="true">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <p className="reports-empty__text">No reports yet.</p>
              <p className="reports-empty__hint">Select a date range above and generate your first health report.</p>
            </div>
          ) : (
            <div className="reports-list">
              {reports.map((r, i) => (
                <div key={r.reportId || i} className="card reports-card">
                  <div className="reports-card__header">
                    <div>
                      <div className="reports-card__date">
                        {r.date ? new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Recent report'}
                      </div>
                      {r.fromDate && r.toDate && (
                        <div className="reports-card__period">
                          {new Date(r.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' \u2014 '}
                          {new Date(r.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {r.symptomCount !== undefined && ` \u00b7 ${r.symptomCount} symptom${r.symptomCount !== 1 ? 's' : ''}`}
                        </div>
                      )}
                      <div className="reports-card__badge">AI Generated Health Report</div>
                    </div>
                    <button
                      className="btn-primary btn-primary--sm reports-card__download"
                      onClick={() => downloadAsPDF(r)}
                      title="Download as PDF"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download PDF
                    </button>
                  </div>
                  <p className="reports-card__summary">{r.summary}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default ReportsPage;
