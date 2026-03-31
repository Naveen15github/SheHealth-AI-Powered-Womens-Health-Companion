import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp, confirmSignUp, resendConfirmationCode } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './AuthPage.css';

function mapCognitoError(err) {
  if (!err) return 'Something went wrong. Please try again.';
  switch (err.code || err.name) {
    case 'UsernameExistsException':
      return 'An account with this email already exists.';
    case 'InvalidPasswordException':
      return 'Password must be at least 8 characters.';
    case 'InvalidParameterException':
      return 'Please check your details and try again.';
    case 'NetworkError':
      return 'Network error. Please check your connection.';
    default:
      return err.message || 'Something went wrong. Please try again.';
  }
}

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('register');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'password' && passwordError) {
      setPasswordError(value.length >= 8 ? '' : 'Password must be at least 8 characters.');
    }
  }

  function validatePassword() {
    if (form.password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return false;
    }
    setPasswordError('');
    return true;
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setApiError('');
    if (!validatePassword()) return;

    setLoading(true);
    try {
      await signUp(form.name, form.email, form.password);
      setEmail(form.email);
      setStep('verify');
    } catch (err) {
      setApiError(mapCognitoError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySubmit(e) {
    e.preventDefault();
    setApiError('');
    setLoading(true);
    try {
      await confirmSignUp(email, otp);
      navigate('/login', { state: { message: 'Account verified! Please log in.' } });
    } catch (err) {
      setApiError('Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await resendConfirmationCode(email);
    } catch (err) {
      setApiError(mapCognitoError(err));
    }
  }

  if (step === 'verify') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__logo">
            <img src="/logo.png" alt="SheHealth" className="logo-img" style={{width: '48px', height: '48px', display: 'block', margin: '0 auto var(--space-sm)', objectFit: 'contain'}} />
            SheHealth
          </div>
          <h1 className="auth-card__title">Check your email</h1>
          <p className="auth-card__subtitle">We sent a 6-digit code to {email}</p>

          <form onSubmit={handleVerifySubmit} noValidate>
            <div className="auth-card__field">
              <label className="auth-card__label" htmlFor="otp">Verification code</label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="input-field"
                placeholder="Enter 6-digit code"
              />
            </div>

            {apiError && <ErrorMessage message={apiError} />}
            {loading ? (
              <LoadingSpinner />
            ) : (
              <button type="submit" className="btn-primary btn-full">
                Verify account
              </button>
            )}
          </form>

          <p className="auth-card__footer">
            Didn't receive it?{' '}
            <button
              type="button"
              className="auth-card__link"
              onClick={handleResend}
            >
              Resend code
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo">
          <img src="/logo.png" alt="SheHealth" className="logo-img" style={{width: '48px', height: '48px', display: 'block', margin: '0 auto var(--space-sm)', objectFit: 'contain'}} />
          SheHealth
        </div>
        <h1 className="auth-card__title">Create your account</h1>
        <p className="auth-card__subtitle">Join thousands of women taking charge of their health</p>

        <form onSubmit={handleRegisterSubmit} noValidate>
          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={handleChange}
              className="input-field"
              placeholder="Jane Smith"
            />
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              className="input-field"
              placeholder="jane@example.com"
            />
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              onBlur={validatePassword}
              className="input-field"
              placeholder="At least 8 characters"
            />
            {passwordError && <p className="auth-card__field-error">{passwordError}</p>}
          </div>

          {apiError && <ErrorMessage message={apiError} />}
          {loading ? (
            <LoadingSpinner />
          ) : (
            <button type="submit" className="btn-primary btn-full">
              Create account
            </button>
          )}
        </form>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-card__link">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
