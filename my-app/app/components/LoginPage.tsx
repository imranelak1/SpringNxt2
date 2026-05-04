'use client';

import { useState } from 'react';
import { login } from '../lib/api';
import { useAlert } from './AlertProvider';
import type { AuthSession } from '../lib/types';

interface LoginPageProps {
  onLogin: (session: AuthSession) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const alerts = useAlert();
  const [email, setEmail] = useState('manager@springnxt.local');
  const [password, setPassword] = useState('password');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const session = await login(email, password);
      onLogin(session);
      const displayName = `${session.firstName} ${session.lastName}`.trim() || session.email;
      alerts.success('Hello!', `Bienvenue ${displayName}`);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Unable to sign in right now.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-head">
          <div className="login-logo">
            <div className="logo-mark">N</div>
            <div className="logo-text">
              NEX<span>US</span>
            </div>
          </div>
          <div className="login-security-pill">Secure workspace</div>
        </div>

        <div className="login-kicker">Project intelligence platform</div>
        <div className="login-title">Sign in to SpringNxt</div>
        <div className="login-sub">
          Access your project portfolio, delivery board, AI insights, and team operations.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Work email</label>
            <input
              className="form-input"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="login-options">
            <label className="login-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Remember this device</span>
            </label>
            <button type="button" className="login-link">Forgot password?</button>
          </div>

          {error ? (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--accent3)',
                marginBottom: '14px',
                background: 'rgba(255,107,107,0.08)',
                padding: '8px 12px',
                borderRadius: '7px',
              }}
            >
              {error}
            </div>
          ) : null}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="login-footnote">
          Protected by encrypted authentication and role-based access control.
        </div>
      </div>
    </div>
  );
}
