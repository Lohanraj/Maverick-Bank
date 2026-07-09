import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export const Login: React.FC = () => {
  const { login, isLoggedIn, role, isAdmin, isEmployee } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Forgot Password feature
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [regeneratedPassword, setRegeneratedPassword] = useState('');

  const API = 'https://localhost:7174/api';

  useEffect(() => {
    // If already logged in, redirect to respective dashboard
    if (isLoggedIn && role) {
      if (isAdmin()) {
        navigate('/admin', { replace: true });
      } else if (isEmployee()) {
        navigate('/employee', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }

    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [isLoggedIn, role, navigate, isAdmin, isEmployee]);

  const handleOpenForgotModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowForgotModal(true);
    setForgotEmail('');
    setForgotMessage('');
    setForgotError('');
    setForgotLoading(false);
    setRegeneratedPassword('');
  };

  const handleCloseForgotModal = () => {
    setShowForgotModal(false);
  };

  const handleRegeneratePassword = async () => {
    setForgotError('');
    setForgotMessage('');

    if (!forgotEmail) {
      setForgotError('Please enter your email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API}/Auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to regenerate password. Make sure the email exists.');
      }

      const data = await res.json();
      setForgotLoading(false);
      setForgotMessage(data.message || 'Password regenerated successfully.');
      setRegeneratedPassword(data.temporaryPassword);
    } catch (err: any) {
      setForgotLoading(false);
      setForgotError(err?.message || 'Failed to regenerate password.');
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        let errText = 'Invalid email or password. Please try again.';
        try {
          const errData = await res.json();
          errText = errData?.message || errData || errText;
        } catch {
          const rawText = await res.text();
          errText = rawText || errText;
        }
        throw new Error(errText);
      }

      const response = await res.json();
      setIsLoading(false);

      // Call auth context login
      login(response.token, response.role, response);

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      if (response.role === 'Admin') {
        navigate('/admin');
      } else if (response.role === 'Employee') {
        navigate('/employee');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="split-container">
      {/* LEFT PANEL: Brand Info & Promotion */}
      <div className="brand-panel">
        <div className="brand-content animate-in">
          <div className="brand-badge">
            <i className="bi bi-shield-fill-check"></i> Secure Banking Session
          </div>
          <h1 className="brand-title">Maverick Bank</h1>
          <h2 className="brand-tagline">Manage your wealth, securely and faster.</h2>
          <p className="brand-description">
            Access your premium retail dashboard to transfer funds, customize credit and debit card limits, apply for instant loans, and monitor account transactions in one place.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-lightning-charge-fill"></i>
              </div>
              <div>
                <div className="feature-title">Instant Transfers</div>
                <div className="feature-desc">Send funds to any internal or external account securely.</div>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-credit-card-2-front-fill"></i>
              </div>
              <div>
                <div className="feature-title">Complete Card Control</div>
                <div className="feature-desc">Freeze cards, set custom ATM limits, and update security PINs.</div>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-wallet2"></i>
              </div>
              <div>
                <div className="feature-title">Fast Loan Decisions</div>
                <div className="feature-desc">Get automated reviews and immediate disbursements directly to your balance.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Login Form */}
      <div className="form-panel">
        <div className="auth-card animate-in">
          {/* Logo */}
          <div className="auth-logo mb-3">
            <div className="auth-logo-icon">
              <i className="bi bi-bank2"></i>
            </div>
            <div className="auth-title" style={{ fontSize: '24px' }}>Welcome Back</div>
          </div>
          <p className="auth-subtitle mb-4">Sign in to continue your secure journey</p>

          {/* Error Alert */}
          {errorMessage && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-circle-fill"></i> {errorMessage}
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-group-icon">
              <i className="bi bi-envelope icon"></i>
              <input
                id="login-email"
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label mb-0">Password</label>
              <a
                href="#"
                className="text-primary"
                style={{ fontSize: '12px', textDecoration: 'none' }}
                onClick={handleOpenForgotModal}
              >
                Forgot password?
              </a>
            </div>
            <div className="input-group-icon">
              <i className="bi bi-lock icon"></i>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '44px' }}
                autoComplete="current-password"
              />
              <i
                className={`bi icon ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                style={{ right: '14px', left: 'auto', cursor: 'pointer' }}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>
          </div>

          {/* Remember Me */}
          <div className="d-flex align-items-center mb-3">
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: '16px', height: '16px', marginRight: '8px', cursor: 'pointer' }}
            />
            <label
              htmlFor="remember-me"
              style={{ fontSize: '13px', color: 'var(--dark-text-dim)', cursor: 'pointer', userSelect: 'none' }}
            >
              Remember me
            </label>
          </div>

          {/* Login Button */}
          <button
            id="login-btn"
            type="button"
            className="btn btn-primary btn-full mt-2"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading && <span className="spinner"></span>}
            {!isLoading && <i className="bi bi-box-arrow-in-right"></i>}
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Divider */}
          <div className="divider"></div>

          {/* Register Link */}
          <p className="text-center mb-0" style={{ fontSize: '13px', color: 'var(--dark-text-dim)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="text-primary" style={{ fontWeight: 600, textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="modal-overlay"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', zIndex: 9999 }}
        >
          <div className="modal-box" style={{ maxWidth: '400px', width: '90%', padding: '24px', borderRadius: '16px' }}>
            <div
              className="modal-title"
              style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="bi bi-shield-lock" style={{ color: 'var(--warning)' }}></i> Reset Password
            </div>
            <p style={{ fontSize: '13px', color: 'var(--dark-text-dim)', marginBottom: '20px' }}>
              Enter your registered email address to regenerate a new temporary password.
            </p>

            {/* Messages */}
            {forgotError && (
              <div className="alert alert-danger" style={{ fontSize: '13px', padding: '10px', marginBottom: '12px' }}>
                <i className="bi bi-exclamation-circle-fill"></i> {forgotError}
              </div>
            )}
            {forgotMessage && (
              <div className="alert alert-success" style={{ fontSize: '13px', padding: '10px', marginBottom: '12px' }}>
                <i className="bi bi-check-circle-fill"></i> {forgotMessage}
              </div>
            )}

            {/* Temporary Password Result */}
            {regeneratedPassword && (
              <div
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--warning)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '4px',
                  }}
                >
                  Temporary Password
                </div>
                <div
                  style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: '#fff', userSelect: 'all', cursor: 'pointer' }}
                  title="Click to select"
                >
                  {regeneratedPassword}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--dark-text-dim)', marginTop: '8px' }}>
                  Use this password to log in and update it in your profile settings.
                </div>
              </div>
            )}

            {!regeneratedPassword && (
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="example@maverick.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
            )}

            <div className="d-flex gap-2 mt-4">
              {!regeneratedPassword && (
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleRegeneratePassword}
                  disabled={forgotLoading}
                >
                  {forgotLoading && <span className="spinner"></span>}
                  {forgotLoading ? 'Regenerating...' : 'Regenerate'}
                </button>
              )}
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleCloseForgotModal}>
                {regeneratedPassword ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
