import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from '../services/authService';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() { signOut(); navigate('/'); }

  function isActive(path) {
    return location.pathname === path ? 'navbar-link active' : 'navbar-link';
  }

  return (
    <>
      <div className="navbar-wrapper">
        <nav className="navbar">
          <Link to="/dashboard" className="navbar-logo">
            <img src="/logo.png" alt="SheHealth" className="navbar-logo__img" />
            <span>SheHealth</span>
          </Link>
          <div className="navbar-links">
            <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
            <Link to="/chat" className={isActive('/chat')}>AI Assistant</Link>
            <Link to="/symptoms" className={isActive('/symptoms')}>Symptoms</Link>
            <Link to="/reports" className={isActive('/reports')}>Reports</Link>
            <button onClick={handleLogout} className="btn-primary btn-primary--sm">Logout</button>
          </div>
          <button
            className="navbar-hamburger"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </nav>
        {menuOpen && (
          <div className="navbar-dropdown">
            <Link to="/dashboard" className="navbar-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link to="/chat" className="navbar-link" onClick={() => setMenuOpen(false)}>AI Assistant</Link>
            <Link to="/symptoms" className="navbar-link" onClick={() => setMenuOpen(false)}>Symptoms</Link>
            <Link to="/reports" className="navbar-link" onClick={() => setMenuOpen(false)}>Reports</Link>
            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="btn-primary btn-primary--sm w-fit"
            >Logout</button>
          </div>
        )}
      </div>
      <div className="navbar-spacer" />
    </>
  );
}

export default Navbar;
