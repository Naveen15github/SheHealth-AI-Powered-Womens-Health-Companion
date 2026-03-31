import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../services/apiService';
import Navbar from '../components/Navbar';
import HospitalFinder from '../components/HospitalFinder';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './DashboardPage.css';

const HEALTH_TIPS = [
  'Stay hydrated — aim for 8 glasses of water today.',
  'A 10-minute walk can boost your mood and energy levels.',
  'Track your cycle to better understand your hormonal patterns.',
  'Deep breathing for 5 minutes can reduce cortisol levels.',
  'Getting 7-9 hours of sleep supports hormonal balance.',
  'Eating iron-rich foods can help manage fatigue during your period.',
  'Mindfulness and journaling can support mental wellness.',
];

function getDailyTip() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return HEALTH_TIPS[dayOfYear % 7];
}

const QUICK_ACTIONS = [
  { 
    label: 'AI Assistant', 
    path: '/chat',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  },
  { 
    label: 'Log Symptoms', 
    path: '/symptoms',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  },
  { 
    label: 'View Reports', 
    path: '/reports',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  },
];

function DashboardPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHospitalFinder, setShowHospitalFinder] = useState(false);

  useEffect(() => {
    getProfile()
      .then((res) => {
        setName(res.data?.name || '');
      })
      .catch((err) => {
        // 404 means profile not set up yet — not an error, just show generic welcome
        if (err?.response?.status !== 404) {
          setError("We couldn't load your profile. Please try again.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const dailyTip = getDailyTip();

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {error ? (
              <ErrorMessage message={error} />
            ) : (
              <h1 className="dashboard-welcome">Welcome back{name ? `, ${name}` : ''}!</h1>
            )}

            <div className="card card-primary-light dashboard-tip">
              <span className="badge-primary">Daily Tip</span>
              <span className="badge-primary" style={{marginLeft: 'var(--space-xs)', background: 'var(--color-mint-light)', color: 'var(--color-mint)'}}>Multilingual AI</span>
              <p className="dashboard-tip__text">{dailyTip}</p>
            </div>

            <div className="card dashboard-multilingual">
              <div className="dashboard-multilingual__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>
              </div>
              <div>
                <p className="dashboard-multilingual__title">SheHealth AI Assistant speaks your language</p>
                <p className="dashboard-multilingual__subtitle">Ask in English, Tamil, or Tanglish — get answers in your language</p>
              </div>
            </div>

            <p className="dashboard-section-label">Quick actions</p>
            <div className="dashboard-actions-grid">
              {QUICK_ACTIONS.map(({ label, path, icon }) => (
                <button
                  key={path}
                  className="card dashboard-action-card"
                  onClick={() => navigate(path)}
                >
                  <span className="dashboard-action-card__icon">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="card-teal dashboard-schedule">
              <h3 className="dashboard-schedule__title">Schedule an Appointment</h3>
              <p className="dashboard-schedule__subtitle">
                Connect with a health professional from the comfort of your home
              </p>
              <button className="btn-primary btn-primary--sm" onClick={() => setShowHospitalFinder(true)}>Book Now</button>
            </div>

            <p className="dashboard-section-label">Health Topics</p>
            <div className="dashboard-highlights-grid">
              {[
                { 
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
                  label: 'Fitness', bg: 'bg-mint-light' 
                },
                { 
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
                  label: 'Wellness', bg: 'bg-purple-light' 
                },
                { 
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
                  label: 'Cycle', bg: 'bg-teal-light' 
                },
                { 
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
                  label: 'Nutrition', bg: 'bg-mint-light' 
                },
                { 
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/><circle cx="12" cy="12" r="10"/></svg>,
                  label: 'Mental Health', bg: 'bg-primary-light' 
                },
                { 
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                  label: 'Community', bg: 'bg-peach' 
                },
              ].map(({ icon, label, bg }) => (
                <div key={label} className={`dashboard-highlight-item ${bg}`}>
                  <span className="dashboard-highlight-item__icon" aria-hidden="true">{icon}</span>
                  <span className="dashboard-highlight-item__label">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {/* Floating AI Assistant Button */}
      <button
        className="dashboard-fab"
        onClick={() => navigate('/chat')}
        aria-label="Open AI Assistant"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>SheHealth AI Assistant</span>
      </button>
      {showHospitalFinder && <HospitalFinder onClose={() => setShowHospitalFinder(false)} />}
    </div>
  );
}

export default DashboardPage;
