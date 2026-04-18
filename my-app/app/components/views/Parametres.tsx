'use client';

import { useMemo, useState } from 'react';
import type { AppRole } from '../../lib/types';

interface ParametresProps {
  email: string;
  role: AppRole;
  firstName: string;
  lastName: string;
}

interface ProfileFormState {
  fullName: string;
  email: string;
  timezone: string;
  language: string;
}

function getInitials(email: string) {
  return email
    .split('@')[0]
    .split(/[.\-_]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getDisplayName(email: string) {
  return email
    .split('@')[0]
    .split(/[.\-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const roleLabel: Record<AppRole, string> = {
  admin: 'Administrateur',
  pm: 'Chef de projet',
  employee: 'Employe',
};

const roleBadge: Record<AppRole, string> = {
  admin: 'b-red',
  pm: 'b-purple',
  employee: 'b-blue',
};

export default function Parametres({ email, role, firstName, lastName }: ParametresProps) {
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : getDisplayName(email);
  const initials =
    firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : getInitials(email);

  const initialProfile = useMemo<ProfileFormState>(
    () => ({
      fullName: displayName,
      email,
      timezone: 'UTC+1 - Casablanca',
      language: 'Francais (FR)',
    }),
    [displayName, email],
  );

  const [prefs, setPrefs] = useState({
    darkMode: true,
    iaResume: true,
    previsions: true,
    alertes: true,
    temps: false,
  });
  const [integrations, setIntegrations] = useState({
    slack: true,
    drive: true,
    github: true,
    stripe: false,
    notion: false,
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profile, setProfile] = useState<ProfileFormState>(initialProfile);
  const [savedProfile, setSavedProfile] = useState<ProfileFormState>(initialProfile);
  const [saveMessage, setSaveMessage] = useState('');

  const togglePref = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));
  const toggleInt = (key: keyof typeof integrations) =>
    setIntegrations((i) => ({ ...i, [key]: !i[key] }));

  const handleProfileSave = () => {
    setSavedProfile(profile);
    setIsEditingProfile(false);
    setSaveMessage('Profil mis a jour.');
  };

  const handleProfileCancel = () => {
    setProfile(savedProfile);
    setIsEditingProfile(false);
    setSaveMessage('');
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div className="section-title">Parametres du compte</div>
        <div className="section-sub">Gerez votre profil, equipe et preferences</div>
      </div>

      <div className="grid-rl">
        <div className="col-stack">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Profil utilisateur</div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (isEditingProfile) {
                    handleProfileCancel();
                  } else {
                    setIsEditingProfile(true);
                    setSaveMessage('');
                  }
                }}
              >
                {isEditingProfile ? 'Fermer' : 'Modifier'}
              </button>
            </div>
            <div
              style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                className="av"
                style={{
                  width: '56px',
                  height: '56px',
                  fontSize: '18px',
                  background: 'linear-gradient(135deg,#667eea,#764ba2)',
                }}
              >
                {initials}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '3px' }}>{displayName}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  {email}
                </div>
                <span className={`badge ${roleBadge[role]}`}>{roleLabel[role]}</span>
              </div>
            </div>
            <div style={{ padding: '4px 0' }}>
              <div className="settings-row">
                <div className="settings-info">
                  <div className="settings-label">Nom complet</div>
                </div>
                <input
                  className="settings-input"
                  value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                  disabled={!isEditingProfile}
                />
              </div>
              <div className="settings-row">
                <div className="settings-info">
                  <div className="settings-label">Email</div>
                </div>
                <input
                  className="settings-input"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  disabled={!isEditingProfile}
                />
              </div>
              <div className="settings-row">
                <div className="settings-info">
                  <div className="settings-label">Fuseau horaire</div>
                </div>
                <select
                  className="settings-input"
                  value={profile.timezone}
                  onChange={(e) => setProfile((p) => ({ ...p, timezone: e.target.value }))}
                  disabled={!isEditingProfile}
                >
                  <option value="UTC+1 - Casablanca">UTC+1 - Casablanca</option>
                  <option value="UTC+1 - Paris">UTC+1 - Paris</option>
                  <option value="UTC+0 - London">UTC+0 - London</option>
                </select>
              </div>
              <div className="settings-row">
                <div className="settings-info">
                  <div className="settings-label">Langue</div>
                </div>
                <select
                  className="settings-input"
                  value={profile.language}
                  onChange={(e) => setProfile((p) => ({ ...p, language: e.target.value }))}
                  disabled={!isEditingProfile}
                >
                  <option value="Francais (FR)">Francais (FR)</option>
                  <option value="English (EN)">English (EN)</option>
                </select>
              </div>
            </div>
            {saveMessage ? (
              <div style={{ padding: '0 20px 16px', fontSize: '12px', color: 'var(--accent)' }}>{saveMessage}</div>
            ) : null}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Membres de l&apos;equipe</div>
              <button className="btn btn-primary btn-sm">+ Inviter</button>
            </div>
            <div className="res-row">
              <div className="av" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <div className="res-name">
                  {displayName}
                  <span style={{ fontSize: '10px', marginLeft: '6px', color: 'var(--accent)' }}>Vous</span>
                </div>
                <div className="res-role">{email}</div>
              </div>
              <span className={`badge ${roleBadge[role]}`}>{roleLabel[role]}</span>
            </div>
          </div>
        </div>

        <div className="col-stack">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Preferences</div>
            </div>
            <div style={{ padding: '4px 0' }}>
              {[
                { key: 'darkMode' as const, label: 'Mode sombre', desc: 'Theme actuellement applique' },
                {
                  key: 'iaResume' as const,
                  label: 'Resume IA quotidien',
                  desc: 'Insights automatiques chaque matin',
                },
                {
                  key: 'previsions' as const,
                  label: 'Previsions intelligentes',
                  desc: 'Predictions delais et budgets',
                },
                { key: 'alertes' as const, label: 'Alertes automatiques', desc: 'Delais, surcharges, budgets' },
                { key: 'temps' as const, label: 'Suivi du temps', desc: 'Enregistrer les heures par tache' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="settings-row">
                  <div className="settings-info">
                    <div className="settings-label">{label}</div>
                    <div className="settings-desc">{desc}</div>
                  </div>
                  <div className={`toggle ${prefs[key] ? 'on' : ''}`} onClick={() => togglePref(key)}></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Integrations</div>
            </div>
            <div style={{ padding: '4px 0' }}>
              {[
                { key: 'slack' as const, label: 'Slack', desc: 'Notifications dans vos canaux' },
                { key: 'drive' as const, label: 'Google Drive', desc: 'Pieces jointes et livrables' },
                { key: 'github' as const, label: 'GitHub', desc: 'Lier commits aux taches dev' },
                { key: 'stripe' as const, label: 'Stripe', desc: 'Suivi paiements clients' },
                { key: 'notion' as const, label: 'Notion', desc: 'Synchroniser documentation' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="settings-row">
                  <div className="settings-info">
                    <div className="settings-label">{label}</div>
                    <div className="settings-desc">{desc}</div>
                  </div>
                  <div className={`toggle ${integrations[key] ? 'on' : ''}`} onClick={() => toggleInt(key)}></div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleProfileSave} disabled={!isEditingProfile}>
              Enregistrer les modifications
            </button>
            <button className="btn btn-ghost" onClick={handleProfileCancel} disabled={!isEditingProfile}>
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
