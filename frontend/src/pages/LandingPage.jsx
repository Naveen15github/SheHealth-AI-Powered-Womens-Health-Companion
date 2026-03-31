import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AnnouncementBanner from '../components/AnnouncementBanner';
import './LandingPage.css';

const CATEGORIES = [
  { icon: '💬', name: 'AI Assistant',        colorClass: 'bg-mint-light' },
  { icon: '📋', name: 'Symptom Tracking',   colorClass: 'bg-peach' },
  { icon: '📊', name: 'Health Reports',     colorClass: 'bg-purple-light' },
  { icon: '🤰', name: 'Pregnancy Wellness', colorClass: 'bg-primary-light' },
  { icon: '🧠', name: 'Mental Health',      colorClass: 'bg-teal-light' },
  { icon: '🥗', name: 'Nutrition',          colorClass: 'bg-mint-light' },
];

const FEATURES_POPUP = {
  en: [
    { icon: '💬', title: 'Multilingual AI Assistant', desc: 'Ask anything about your health in English, Tamil, or Tanglish.' },
    { icon: '📋', title: 'Symptom Tracking', desc: 'Log daily symptoms and monitor patterns over time.' },
    { icon: '📊', title: 'Weekly Reports', desc: 'Get personalised weekly health summaries for your doctor.' },
  ],
  ta: [
    { icon: '💬', title: 'பன்மொழி AI உதவியாளர்', desc: 'ஆங்கிலம், தமிழ் அல்லது தங்கிலிஷில் உங்கள் உடல்நலம் பற்றி கேளுங்கள்.' },
    { icon: '📋', title: 'அறிகுறி கண்காணிப்பு', desc: 'தினசரி அறிகுறிகளை பதிவு செய்து உங்கள் உடலை புரிந்துகொள்ளுங்கள்.' },
    { icon: '📊', title: 'வாராந்திர அறிக்கைகள்', desc: 'உங்கள் மருத்துவரிடம் பகிர தனிப்பயனாக்கப்பட்ட சுகாதார சுருக்கங்கள்.' },
  ],
  tg: [
    { icon: '💬', title: 'Multilingual AI Assistant', desc: 'Ungal health pathi English, Tamil, ya Tanglish la kekkalaam.' },
    { icon: '📋', title: 'Symptom Tracking', desc: 'Daily symptoms log pannி ungal body-a better-a purinjukonga.' },
    { icon: '📊', title: 'Weekly Reports', desc: 'Doctor kita share panna personalized health summary kedaikum.' },
  ],
};

const HOW_IT_WORKS_POPUP = {
  en: [
    { icon: '🔐', title: 'Amazon Cognito', desc: 'Secure user authentication and account management.' },
    { icon: '⚡', title: 'AWS Lambda', desc: 'Serverless functions that power the AI chat and reports.' },
    { icon: '🗄️', title: 'Amazon DynamoDB', desc: 'Fast NoSQL database storing your health data.' },
    { icon: '🪣', title: 'Amazon S3', desc: 'Reliable storage for generated health reports.' },
    { icon: '🌐', title: 'API Gateway', desc: 'Secure REST API connecting frontend to backend.' },
    { icon: '🤖', title: 'Groq AI', desc: 'Ultra-fast AI inference for multilingual health responses.' },
  ],
  ta: [
    { icon: '🔐', title: 'Amazon Cognito', desc: 'பாதுகாப்பான பயனர் அங்கீகாரம் மற்றும் கணக்கு மேலாண்மை.' },
    { icon: '⚡', title: 'AWS Lambda', desc: 'AI சாட் மற்றும் அறிக்கைகளை இயக்கும் சர்வர்லெஸ் செயல்பாடுகள்.' },
    { icon: '🗄️', title: 'Amazon DynamoDB', desc: 'உங்கள் சுகாதார தரவை சேமிக்கும் வேகமான NoSQL தரவுத்தளம்.' },
    { icon: '🪣', title: 'Amazon S3', desc: 'உருவாக்கப்பட்ட சுகாதார அறிக்கைகளுக்கான நம்பகமான சேமிப்பு.' },
    { icon: '🌐', title: 'API Gateway', desc: 'முன்பக்கத்தை பின்பக்கத்துடன் இணைக்கும் பாதுகாப்பான REST API.' },
    { icon: '🤖', title: 'Groq AI', desc: 'பன்மொழி சுகாதார பதில்களுக்கான அதி-வேக AI அனுமான இயந்திரம்.' },
  ],
  tg: [
    { icon: '🔐', title: 'Amazon Cognito', desc: 'Secure-a login pannanum, account manage pannanum.' },
    { icon: '⚡', title: 'AWS Lambda', desc: 'AI chat-um reports-um run aaga serverless functions use pannrom.' },
    { icon: '🗄️', title: 'Amazon DynamoDB', desc: 'Ungal health data-va store panna fast NoSQL database.' },
    { icon: '🪣', title: 'Amazon S3', desc: 'Generate aana health reports-a store panna S3 use pannrom.' },
    { icon: '🌐', title: 'API Gateway', desc: 'Frontend-a backend-oda connect panna secure REST API.' },
    { icon: '🤖', title: 'Groq AI', desc: 'Multilingual health responses-ku ultra-fast AI engine.' },
  ],
};

const FEATURES_MAIN = [
  { icon: '💬', iconBgClass: 'bg-mint-light', title: 'Multilingual AI Assistant', desc: 'Ask anything about your health in English, Tamil, or Tanglish — our multilingual AI understands you and responds in your language.' },
  { icon: '📋', iconBgClass: 'bg-primary-light', title: 'Symptom Tracking', desc: 'Log daily symptoms and monitor patterns over time to better understand your body.' },
  { icon: '📊', iconBgClass: 'bg-purple-light', title: 'Weekly Reports', desc: 'Get personalised weekly health summaries you can share with your doctor.' },
];

const LANG_LABELS = { en: 'English', ta: 'Tamil', tg: 'Tanglish' };

function NavPopup({ items, onClose }) {
  const [lang, setLang] = useState('en');
  const popupRef = useRef(null);

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="nav-popup" ref={popupRef} role="dialog" aria-modal="true">
      <div className="nav-popup__langs">
        {Object.entries(LANG_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`nav-popup__lang-btn${lang === key ? ' nav-popup__lang-btn--active' : ''}`}
            onClick={() => setLang(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="nav-popup__content">
        {items[lang].map((item) => (
          <div key={item.title} className="nav-popup__item">
            <span className="nav-popup__item-icon" aria-hidden="true">{item.icon}</span>
            <div>
              <div className="nav-popup__item-title">{item.title}</div>
              <div className="nav-popup__item-desc">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const [openPopup, setOpenPopup] = useState(null); // 'features' | 'howitworks' | null
  const navRef = useRef(null);

  function scrollToFeatures(e) {
    e.preventDefault();
    setOpenPopup(null);
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }

  function togglePopup(name, e) {
    e.preventDefault();
    setOpenPopup(prev => prev === name ? null : name);
  }

  // Close popup on outside click
  useEffect(() => {
    function handleClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenPopup(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="landing-page">
      <AnnouncementBanner />

      <nav className="landing-nav" aria-label="Public navigation" ref={navRef}>
        <a href="/" className="landing-nav__logo" aria-label="SheHealth home">
          <img src="/logo.png" alt="SheHealth" className="logo-img" />
          SheHealth
        </a>

        <div className="landing-nav__links">
          <div className="nav-link-wrap">
            <a
              href="#features"
              className={`landing-nav__link${openPopup === 'features' ? ' landing-nav__link--active' : ''}`}
              onClick={(e) => togglePopup('features', e)}
              aria-expanded={openPopup === 'features'}
            >
              Features ▾
            </a>
            {openPopup === 'features' && (
              <NavPopup items={FEATURES_POPUP} onClose={() => setOpenPopup(null)} />
            )}
          </div>

          <div className="nav-link-wrap">
            <a
              href="#how"
              className={`landing-nav__link${openPopup === 'howitworks' ? ' landing-nav__link--active' : ''}`}
              onClick={(e) => togglePopup('howitworks', e)}
              aria-expanded={openPopup === 'howitworks'}
            >
              How It Works ▾
            </a>
            {openPopup === 'howitworks' && (
              <NavPopup items={HOW_IT_WORKS_POPUP} onClose={() => setOpenPopup(null)} />
            )}
          </div>
        </div>

        <div className="landing-nav__actions">
          <button className="btn-primary" onClick={() => navigate('/register')}>
            Sign Up
          </button>
        </div>
      </nav>

      <section className="hero" aria-label="Hero">
        <div className="hero__content">
          <h1 className="hero__title">
            Take Your First Steps on the{' '}
            <span className="text-primary">Health Path</span>
          </h1>
          <p className="hero__subtitle">
            A compassionate multilingual AI health assistant for women — speaks English, Tamil &amp; Tanglish. Track symptoms, chat with AI, and get personalised weekly reports.
          </p>
          <div className="hero__cta-row">
            <button className="btn-primary" onClick={() => navigate('/register')}>Get Started →</button>
            <button className="btn-secondary" onClick={scrollToFeatures}>Learn More →</button>
          </div>
          <div className="hero__lang-badge">
            <span className="badge-primary">Multilingual</span>
            <span className="hero__lang-text">Supports English · Tamil · Tanglish</span>
          </div>
          <p className="hero__social-proof">⭐⭐⭐⭐⭐ Trusted by 50K+ women</p>
        </div>
        <div className="hero__graphic">
          <img
            src="/Gemini_Generated_Image_idh7xsidh7xsidh7.png"
            alt="SheHealth AI Health Assistant"
            className="hero__image"
          />
        </div>
      </section>

      <section className="categories" aria-label="Explore categories">
        <h2 className="section-heading">Explore Categories</h2>
        <div className="categories__scroll">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className={`category-card ${cat.colorClass}`}
              role="button"
              tabIndex={0}
              aria-label={cat.name}
              onClick={() => navigate('/register')}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/register')}
            >
              <div className="category-card__icon" aria-hidden="true">{cat.icon}</div>
              <div className="category-card__name">{cat.name}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="features-section" aria-label="Features">
        <h2 className="section-heading">Everything You Need</h2>
        <div className="features-grid">
          {FEATURES_MAIN.map((f) => (
            <div key={f.title} className="card feature-card">
              <div className={`feature-card__icon-wrap ${f.iconBgClass}`} aria-hidden="true">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <h2 className="landing-footer__heading">Join SheHealth Today</h2>
        <button className="btn-primary" onClick={() => navigate('/register')}>Sign Up Free</button>
        <p className="landing-footer__copyright">© {new Date().getFullYear()} SheHealth. All rights reserved.</p>
        <p className="landing-footer__disclaimer">General health information only. Always consult a qualified doctor.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
