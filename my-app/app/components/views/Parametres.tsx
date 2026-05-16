'use client';

import { useState } from 'react';
import Swal from 'sweetalert2';
import { updateProfile } from '../../lib/api';
import type { AppRole } from '../../lib/types';

interface ParametresProps {
  token: string;
  email: string;
  role: AppRole;
  firstName: string;
  lastName: string;
  onProfileUpdated: (firstName: string, lastName: string) => void;
}

function getInitials(firstName: string, lastName: string, email: string) {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  return email.split('@')[0].split(/[.\-_]/).filter(Boolean).slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '').join('');
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

export default function Parametres({ token, email, role, firstName, lastName, onProfileUpdated }: ParametresProps) {
  const [firstNameValue, setFirstNameValue] = useState(firstName);
  const [lastNameValue, setLastNameValue] = useState(lastName);
  const [saving, setSaving] = useState(false);

  const [prefs, setPrefs] = useState({ darkMode: true, iaResume: true, previsions: true, alertes: true, temps: false });
  const [integrations, setIntegrations] = useState({ slack: true, drive: true, github: true, stripe: false, notion: false });

  const togglePref = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));
  const toggleInt = (key: keyof typeof integrations) => setIntegrations((i) => ({ ...i, [key]: !i[key] }));

  const displayName = firstNameValue && lastNameValue
    ? `${firstNameValue} ${lastNameValue}`
    : email.split('@')[0];
  const initials = getInitials(firstNameValue, lastNameValue, email);

  const handleSave = async () => {
    const fn = firstNameValue.trim();
    const ln = lastNameValue.trim();
    if (!fn || !ln) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Le prénom et le nom sont requis.',
        background: 'var(--surface)',
        color: 'var(--text)',
        confirmButtonColor: '#0d5abc',
        customClass: {
          popup: 'swal-popup',
          title: 'swal-title',
          content: 'swal-content',
          confirmButton: 'swal-confirm-btn',
        },
      });
      return;
    }

    setSaving(true);

    try {
      const updated = await updateProfile(token, { firstName: fn, lastName: ln });
      onProfileUpdated(updated.firstName ?? fn, updated.lastName ?? ln);
      Swal.fire({
        icon: 'success',
        title: 'Succès!',
        text: 'Profil mis à jour avec succès.',
        timer: 2000,
        showConfirmButton: false,
        background: 'var(--surface)',
        color: 'var(--text)',
        customClass: {
          popup: 'swal-popup',
          title: 'swal-title',
          content: 'swal-content',
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.';
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
        background: 'var(--surface)',
        color: 'var(--text)',
        confirmButtonColor: '#0d5abc',
        customClass: {
          popup: 'swal-popup',
          title: 'swal-title',
          content: 'swal-content',
          confirmButton: 'swal-confirm-btn',
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstNameValue(firstName);
    setLastNameValue(lastName);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div className="section-title">Paramètres du compte</div>
        <div className="section-sub">Gérez votre profil, équipe et préférences</div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', width: 'fit-content' }}>
        <button className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
        <button className="btn btn-ghost" onClick={handleCancel} disabled={saving}>Annuler</button>
      </div>

      <div className="grid-rl">
        <div className="col-stack">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Profil utilisateur</div>
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
                <div className="settings-info"><div className="settings-label">Prénom</div></div>
                <input
                  className="settings-input"
                  value={firstNameValue}
                  onChange={(e) => { setFirstNameValue(e.target.value); }}
                />
              </div>
              <div className="settings-row">
                <div className="settings-info"><div className="settings-label">Nom</div></div>
                <input
                  className="settings-input"
                  value={lastNameValue}
                  onChange={(e) => { setLastNameValue(e.target.value); }}
                />
              </div>
              <div className="settings-row">
                <div className="settings-info"><div className="settings-label">Email</div></div>
                <input className="settings-input" value={email} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div className="settings-row">
                <div className="settings-info"><div className="settings-label">Rôle</div></div>
                <input className="settings-input" value={roleLabel[role]} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Membres de l&apos;équipe</div>
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
              {([
                { key: 'darkMode' as const,    label: 'Mode sombre',             desc: 'Thème actuellement appliqué' },
                { key: 'iaResume' as const,    label: 'Résumé IA quotidien',     desc: 'Insights automatiques chaque matin' },
                { key: 'previsions' as const,  label: 'Prévisions intelligentes', desc: 'Prédictions délais et budgets' },
                { key: 'alertes' as const,     label: 'Alertes automatiques',    desc: 'Délais, surcharges, budgets' },
                { key: 'temps' as const,       label: 'Suivi du temps',          desc: 'Enregistrer les heures par tâche' },
              ] as const).map(({ key, label, desc }) => (
                <div key={key} className="settings-row">
                  <div className="settings-info">
                    <div className="settings-label">{label}</div>
                    <div className="settings-desc">{desc}</div>
                  </div>
                  <div className={`toggle ${prefs[key] ? 'on' : ''}`} onClick={() => togglePref(key)} />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Intégrations</div></div>
            <div style={{ padding: '4px 0' }}>
              {([
                { key: 'slack' as const,   label: 'Slack',        desc: 'Notifications dans vos canaux' },
                { key: 'drive' as const,   label: 'Google Drive', desc: 'Pièces jointes et livrables' },
                { key: 'github' as const,  label: 'GitHub',       desc: 'Lier commits aux tâches dev' },
                { key: 'stripe' as const,  label: 'Stripe',       desc: 'Suivi paiements clients' },
                { key: 'notion' as const,  label: 'Notion',       desc: 'Synchroniser documentation' },
              ] as const).map(({ key, label, desc }) => (
                <div key={key} className="settings-row">
                  <div className="settings-info">
                    <div className="settings-label">{label}</div>
                    <div className="settings-desc">{desc}</div>
                  </div>
                  <div className={`toggle ${integrations[key] ? 'on' : ''}`} onClick={() => toggleInt(key)} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

