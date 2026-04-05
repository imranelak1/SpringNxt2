'use client';

import { useState } from 'react';
import { login } from '../lib/api';
import type { AuthSession } from '../lib/types';

interface LoginPageProps {
  onLogin: (session: AuthSession) => void;
}

const demoAccounts = [
  { label: 'Administrateur', email: 'admin@springnxt.local', password: 'password', icon: '\u{1F6E1}' },
  { label: 'Chef de Projet', email: 'manager@springnxt.local', password: 'password', icon: '\u{1F4CB}' },
  { label: 'Employe', email: 'employee1@springnxt.local', password: 'password', icon: '\u{1F464}' },
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState(demoAccounts[1].email);
  const [password, setPassword] = useState(demoAccounts[1].password);
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
        <div className="login-logo">
          <div className="logo-mark">N</div>
          <div className="logo-text">
            NEX<span>US</span>
          </div>
        </div>
        <div className="login-title">Connect to SpringNxt</div>
        <div className="login-sub">Connectez-vous a votre espace de travail intelligent</div>

        <div className="role-pills">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              className={`role-pill ${email === account.email ? 'active' : ''}`}
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
              }}
            >
              <span style={{ display: 'block', fontSize: '15px', marginBottom: '3px' }}>{account.icon}</span>
              <span style={{ fontSize: '11px' }}>{account.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Adresse email</label>
            <input
              className="form-input"
              type="email"
              placeholder="manager@springnxt.local"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              className="form-input"
              type="password"
              placeholder="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
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
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            padding: '14px',
            background: 'var(--surface2)',
            borderRadius: '10px',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            Acces demonstration
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.7 }}>
            Admin: <strong style={{ color: 'var(--text)' }}>admin@springnxt.local</strong>
            <br />
            Manager: <strong style={{ color: 'var(--text)' }}>manager@springnxt.local</strong>
            <br />
            Employe: <strong style={{ color: 'var(--text)' }}>employee1@springnxt.local</strong>
            <br />
            Password: <strong style={{ color: 'var(--text)' }}>password</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
