import React, { useState, useEffect } from 'react';
import { logSymptom, getSymptoms } from '../services/apiService';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './SymptomLoggerPage.css';

const SYMPTOM_TYPES = [
  { value: 'cramps',   label: 'Cramps' },
  { value: 'fatigue',  label: 'Fatigue' },
  { value: 'mood',     label: 'Mood swings' },
  { value: 'bloating', label: 'Bloating' },
  { value: 'headache', label: 'Headache' },
  { value: 'other',    label: 'Other' },
];

function SymptomLoggerPage() {
  const today = new Date().toISOString().split('T')[0];
  const [symptoms, setSymptoms] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [listError, setListError] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ symptomType: 'cramps', severity: 5, notes: '', date: today });

  useEffect(() => {
    getSymptoms()
      .then((res) => setSymptoms(res.data || []))
      .catch(() => setListError("We couldn't load your symptoms. Please try again."))
      .finally(() => setLoadingList(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await logSymptom(form);
      const newEntry = { ...form, timestamp: new Date(form.date + 'T12:00:00').toISOString() };
      setSymptoms((prev) => [newEntry, ...prev]);
      setForm({ symptomType: 'cramps', severity: 5, notes: '', date: today });
    } catch {
      setFormError('Something went wrong logging your symptom. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="symptom-page">
      <Navbar />
      <div className="page-container symptom-container">
        <h1 className="symptom-heading">Symptom Logger</h1>

        <div className="card card-primary-light symptom-form-card">
          <h2 className="symptom-form-card__title">Log a symptom</h2>
          <form onSubmit={handleSubmit}>
            <div className="auth-card__field">
              <label className="auth-card__label" htmlFor="symptomType">Symptom type</label>
              <select
                id="symptomType"
                className="input-field"
                value={form.symptomType}
                onChange={(e) => setForm((p) => ({ ...p, symptomType: e.target.value }))}
              >
                {SYMPTOM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="auth-card__field">
              <label className="auth-card__label" htmlFor="symptomDate">Date</label>
              <input
                id="symptomDate"
                type="date"
                className="input-field"
                value={form.date}
                max={today}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="auth-card__field">
              <label className="auth-card__label" htmlFor="severity">Severity: {form.severity}/10</label>
              <input
                id="severity"
                type="range"
                min="1"
                max="10"
                step="1"
                className="symptom-slider"
                value={form.severity}
                onChange={(e) => setForm((p) => ({ ...p, severity: Number(e.target.value) }))}
                aria-label={`Severity: ${form.severity} out of 10`}
              />
            </div>
            <div className="auth-card__field">
              <label className="auth-card__label" htmlFor="notes">Notes (optional)</label>
              <textarea
                id="notes"
                className="input-field symptom-textarea"
                placeholder="Any additional details..."
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            {formError && <ErrorMessage message={formError} />}
            {submitting ? <LoadingSpinner /> : (
              <button type="submit" className="btn-primary btn-full">Log Symptom</button>
            )}
          </form>
        </div>

        <h2 className="symptom-list-heading">Recent symptoms</h2>
        {loadingList ? <LoadingSpinner /> : listError ? <ErrorMessage message={listError} /> : (
          symptoms.length === 0 ? (
            <div className="symptom-empty">No symptoms logged yet. How are you feeling today?</div>
          ) : (
            symptoms.slice().reverse().map((s, i) => (
              <div key={i} className="card symptom-entry">
                <div className="symptom-entry__header">
                  <span className="symptom-entry__type">
                    {SYMPTOM_TYPES.find(t => t.value === s.symptomType)?.label || s.symptomType}
                  </span>
                  <span className="symptom-entry__severity">Severity: {s.severity}/10</span>
                </div>
                <div className="symptom-entry__date">
                  {new Date(s.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                {s.notes && <div className="symptom-entry__notes">{s.notes}</div>}
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

export default SymptomLoggerPage;
