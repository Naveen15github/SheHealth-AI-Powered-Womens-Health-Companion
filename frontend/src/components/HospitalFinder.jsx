import { useState } from 'react';
import './HospitalFinder.css';

function HospitalFinder({ onClose }) {
  const [status, setStatus] = useState('idle');
  const [locationName, setLocationName] = useState('');
  const [cityInput, setCityInput] = useState('');

  function getCurrentLocation() {
    setStatus('loading');
    if (!navigator.geolocation) {
      setStatus('manual');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        // Open Google Maps with hospitals near coordinates
        window.open(
          `https://www.google.com/maps/search/hospitals/@${latitude},${longitude},14z`,
          '_blank',
          'noopener,noreferrer'
        );
        setStatus('opened');
      },
      () => {
        setStatus('manual');
      },
      { timeout: 10000 }
    );
  }

  function searchByCity() {
    const city = cityInput.trim();
    if (!city) return;
    window.open(
      `https://www.google.com/maps/search/hospitals+near+${encodeURIComponent(city)}`,
      '_blank',
      'noopener,noreferrer'
    );
    setStatus('opened');
  }

  return (
    <div className="hospital-overlay" onClick={onClose}>
      <div className="hospital-modal" onClick={e => e.stopPropagation()}>
        <div className="hospital-modal__header">
          <h2 className="hospital-modal__title">Find Nearby Hospitals</h2>
          <button className="hospital-modal__close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {status === 'idle' && (
          <div className="hospital-modal__idle">
            <div className="hospital-modal__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <p className="hospital-modal__desc">Find hospitals and clinics near you</p>
            <button className="btn-primary" onClick={getCurrentLocation}>
              Use My Current Location
            </button>
            <p className="hospital-modal__or">— or search by city —</p>
            <div className="hospital-search-row">
              <input
                type="text"
                className="input-field"
                placeholder="Enter city name (e.g. Chennai)"
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchByCity()}
              />
              <button className="btn-primary btn-primary--sm" onClick={searchByCity}>Search</button>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="hospital-modal__loading">
            <div className="hospital-spinner" />
            <p>Getting your location...</p>
          </div>
        )}

        {status === 'manual' && (
          <div className="hospital-modal__idle">
            <p className="hospital-modal__desc">Location access denied. Search by city instead:</p>
            <div className="hospital-search-row">
              <input
                type="text"
                className="input-field"
                placeholder="Enter city name (e.g. Chennai)"
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchByCity()}
              />
              <button className="btn-primary btn-primary--sm" onClick={searchByCity}>Search</button>
            </div>
          </div>
        )}

        {status === 'opened' && (
          <div className="hospital-modal__idle">
            <div className="hospital-modal__icon" style={{color: 'var(--color-mint)'}}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <p className="hospital-modal__desc">Google Maps opened with nearby hospitals!</p>
            <button className="btn-primary" onClick={getCurrentLocation}>Search Again</button>
            <button className="btn-ghost" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HospitalFinder;
