import { useState } from 'react';
import './AnnouncementBanner.css';

function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return !!sessionStorage.getItem('banner-dismissed');
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  function handleDismiss() {
    try {
      sessionStorage.setItem('banner-dismissed', 'true');
    } catch {
      // sessionStorage unavailable — fail silently
    }
    setDismissed(true);
  }

  return (
    <div className="announcement-banner" role="banner">
      <span className="announcement-banner__text">
        Your compassionate AI health companion — now with weekly reports ✨
      </span>
      <button
        className="announcement-banner__dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
      >
        ×
      </button>
    </div>
  );
}

export default AnnouncementBanner;
