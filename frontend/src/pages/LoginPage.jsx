import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  signIn,
  verifySignInOtp,
  confirmSignUp,
  resendConfirmationCode,
} from '../services/authService';
import { getProfile } from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './AuthPage.css';

function mapLoginError(err) {
  const code = err?.code || err?.name;
  switch (code) {
    case 'UserNotConfirmedException':
      return 'Your account is not verified yet. Please complete signup verification first.';
    case 'UserNotFoundException':
      return 'No account found with this email.';
    case 'NotAuthorizedException':
      return 'Incorrect email or password. Please try again.';
    case 'PasswordResetRequiredException':
      return 'Password reset is required for this account.';
    case 'LimitExceededException':
      return 'Too many attempts. Please wait and try again.';
    default:
      return err?.message || 'Login failed. Please try again.';
  }
}

function mapOtpError(err) {
  const code = err?.code || err?.name;
  switch (code) {
    case 'CodeMismatchException':
      return 'Invalid OTP code. Please try again.';
    case 'ExpiredCodeException':
      return 'OTP expired. Please request a new code and try again.';
    case 'NotAuthorizedException':
      return 'OTP verification failed. Please retry login.';
    case 'LimitExceededException':
      return 'Too many attempts. Please wait and try again.';
    default:
      return err?.message || 'OTP verification failed. Please try again.';
  }
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [step, setStep] = useState('credentials');
  const [otp, setOtp] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [challengeName, setChallengeName] = useState('SMS_MFA');
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const result = await signIn(form.email, form.password);

      if (result.status === 'MFA_REQUIRED') {
        setChallengeName(result.challengeName || 'SMS_MFA');
        setStep('otp');
        return;
      }

      if (result.status === 'SUCCESS') {
        // Determine where to redirect: if no profile exists, go to /profile setup
        try {
          await getProfile();
          navigate('/dashboard');
        } catch (profileErr) {
          // 404 or any error means profile not set up yet
          navigate('/profile');
        }
      }
    } catch (authErr) {
      const code = authErr?.code || authErr?.name;
      if (code === 'UserNotConfirmedException') {
        setVerificationEmail(form.email.trim());
        setStep('verifyAccount');
        return;
      }
      setError(mapLoginError(authErr));
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifySignInOtp(otp, challengeName);

      // Determine where to redirect: if no profile exists, go to /profile setup
      try {
        await getProfile();
        navigate('/dashboard');
      } catch (profileErr) {
        // 404 or any error means profile not set up yet
        navigate('/profile');
      }
    } catch (authErr) {
      setError(mapOtpError(authErr));
    } finally {
      setLoading(false);
    }
  }

  function handleBackToCredentials() {
    setStep('credentials');
    setOtp('');
    setVerifyCode('');
    setError('');
  }

  async function handleVerifyAccountSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await confirmSignUp(verificationEmail, verifyCode);
      setStep('credentials');
      setVerifyCode('');
      setSuccessMessage('Account verified successfully. Please log in.');
    } catch (verifyErr) {
      setError('Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerificationCode() {
    setError('');
    try {
      await resendConfirmationCode(verificationEmail);
      setSuccessMessage('A new verification code has been sent.');
    } catch (resendErr) {
      setError(resendErr?.message || 'Could not resend code. Please try again.');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo">
          <img src="/logo.png" alt="SheHealth" className="logo-img" style={{width: '48px', height: '48px', display: 'block', margin: '0 auto var(--space-sm)', objectFit: 'contain'}} />
          SheHealth
        </div>
        <h1 className="auth-card__title">
          {step === 'otp' ? 'Enter OTP' : step === 'verifyAccount' ? 'Verify your account' : 'Welcome back'}
        </h1>
        <p className="auth-card__subtitle">
          {step === 'otp'
            ? 'Complete login with the code sent to your email or phone'
            : step === 'verifyAccount'
              ? 'Enter the verification code sent to your email'
              : 'Log in to continue your health journey'}
        </p>
        {successMessage && step !== 'otp' && (
          <div className="auth-card__success">{successMessage}</div>
        )}

        {step === 'credentials' ? (
          <form onSubmit={handleSubmit} noValidate>
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
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Your password"
              />
            </div>

            {error && <ErrorMessage message={error} />}
            {loading ? (
              <LoadingSpinner />
            ) : (
              <button type="submit" className="btn-primary btn-full">
                Log in
              </button>
            )}
          </form>
        ) : step === 'otp' ? (
          <form onSubmit={handleOtpSubmit} noValidate>
            <p className="auth-card__helper">Code requested for {form.email}</p>
            <div className="auth-card__field">
              <label className="auth-card__label" htmlFor="otp">One-time password</label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="input-field"
                placeholder="Enter 6-digit code"
              />
            </div>

            {error && <ErrorMessage message={error} />}
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <button type="submit" className="btn-primary btn-full">
                  Verify OTP
                </button>
                <button type="button" className="btn-ghost btn-full" onClick={handleBackToCredentials}>
                  Back
                </button>
              </>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerifyAccountSubmit} noValidate>
            <p className="auth-card__helper">Code requested for {verificationEmail || form.email}</p>
            <div className="auth-card__field">
              <label className="auth-card__label" htmlFor="verifyCode">Verification code</label>
              <input
                id="verifyCode"
                name="verifyCode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="input-field"
                placeholder="Enter 6-digit code"
              />
            </div>

            {error && <ErrorMessage message={error} />}
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <button type="submit" className="btn-primary btn-full">
                  Verify account
                </button>
                <button type="button" className="btn-ghost btn-full" onClick={handleBackToCredentials}>
                  Back
                </button>
              </>
            )}

            <p className="auth-card__footer">
              Didn't receive the code?{' '}
              <button
                type="button"
                className="auth-card__link"
                onClick={handleResendVerificationCode}
              >
                Resend code
              </button>
            </p>
          </form>
        )}

        <p className="auth-card__footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-card__link">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
