'use client';
import { useState } from 'react';
import type { AppRole } from '../../lib/types';

interface ParametresProps {
  email: string;
  role: AppRole;
  firstName: string;
  lastName: string;
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
  pm: 'Chef de Projet',
  employee: 'Employé',
};

const roleBadge: Record<AppRole, string> = {
  admin: 'b-red',
  pm: 'b-purple',
  employee: 'b-blue',
};

export default function Parametres({ email, role, firstName, lastName }: ParametresProps) {
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : getDisplayName(email);
  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : getInitials(email);

  const [prefs, setPrefs] = useState({ darkMode: true, iaResume: true, previsions: true, alertes: true, temps: false });
  const [integrations, setIntegrations] = useState({ slack: true, drive: true, github: true, stripe: false, notion: false });
  const [nameValue, setNameValue] = useState(displayName);
  const [emailValue, setEmailValue] = useState(email);

  const togglePref = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));
  const toggleInt = (key: keyof typeof integrations) => setIntegrations((i) => ({ ...i, [key]: !i[key] }));

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div className="section-title">Paramètres du compte</div>
        <div className="section-sub">Gérez votre profil, équipe et préférences</div>
      </div>

      <div className="grid-rl">
        <div className="col-stack">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Profil utilisateur</div>
              <button className="btn btn-ghost btn-sm">Modifier</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border)' }}>
              <div className="av" style={{ width: '56px', height: '56px', fontSize: '18px', background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '3px' }}>{displayName}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '5px' }}>{email}</div>
                <span className={`badge ${roleBadge[role]}`}>{roleLabel[role]}</span>
              </div>
            </div>
            <div style={{ padding: '4px 0' }}>
              <div className="settings-row">
                <div className="settings-info"><div className="settings-label">Nom complet</div></div>
                <input className="settings-input" value={nameValue} onChange={(e) => setNameValue(e.target.value)} />
              </div>
              <div className="settings-row">
                <div className="settings-info"><div className="settings-label">Email</div></div>
                <input className="settings-input" value={emailValue} onChange={(e) => setEmailValue(e.target.value)} />
              </div>
              <div className="settings-row">
                <div className="settings-info"><div className="settings-label">Fuseau horaire</div></div>
                <input className="settings-input" defaultValue="UTC+1 · Casablanca" />
              </div>
              <div className="settings-row">
                <div className="settings-info"><div className="settings-label">Langue</div></div>
                <input className="settings-input" defaultValue="Français (FR)" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Membres de l'équipe</div>
              <button className="btn btn-primary btn-sm">＋ Inviter</button>
            </div>
            <div className="res-row">
              <div className="av" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>{initials}</div>
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
            <div className="card-header"><div className="card-title">Préférences</div></div>
            <div style={{ padding: '4px 0' }}>
              {[
                { key: 'darkMode' as const, label: 'Mode sombre', desc: 'Thème actuellement appliqué' },
                { key: 'iaResume' as const, label: 'Résumé IA quotidien', desc: 'Insights automatiques chaque matin' },
                { key: 'previsions' as const, label: 'Prévisions intelligentes', desc: 'Prédictions délais et budgets' },
                { key: 'alertes' as const, label: 'Alertes automatiques', desc: 'Délais, surcharges, budgets' },
                { key: 'temps' as const, label: 'Suivi du temps', desc: 'Enregistrer les heures par tâche' },
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
            <div className="card-header"><div className="card-title">Intégrations</div></div>
            <div style={{ padding: '4px 0' }}>
              {[
                { key: 'slack' as const, label: 'Slack', desc: 'Notifications dans vos canaux' },
                { key: 'drive' as const, label: 'Google Drive', desc: 'Pièces jointes et livrables' },
                { key: 'github' as const, label: 'GitHub', desc: 'Lier commits aux tâches dev' },
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
            <button className="btn btn-primary" style={{ flex: 1 }}>Enregistrer les modifications</button>
            <button className="btn btn-ghost">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}
