'use client';

import { useEffect, useState } from 'react';
import { getNotifications } from '../../lib/api';
import type { NotificationItem } from '../../lib/types';

interface NotificationsProps {
  token: string;
}

const TYPE_ICONS: Record<NotificationItem['type'], string> = {
  ALERT: '⚠',
  WARNING: '🟡',
  SUCCESS: '✅',
  INFO: '🔔',
};

const TYPE_BG: Record<NotificationItem['type'], string> = {
  ALERT: 'rgba(255,107,107,0.1)',
  WARNING: 'rgba(255,203,71,0.1)',
  SUCCESS: 'rgba(79,255,176,0.1)',
  INFO: 'rgba(61,138,255,0.1)',
};

const PREF_KEYS = ['delais', 'surcharge', 'commentaires', 'resume', 'budgets', 'email'] as const;
type PrefKey = typeof PREF_KEYS[number];
const PREF_LABELS: Record<PrefKey, { label: string; desc: string }> = {
  delais:       { label: 'Alertes délais critiques',  desc: 'Notifier si < 7 jours avant échéance' },
  surcharge:    { label: 'Surcharge ressources',      desc: 'Alerte si charge > 100%' },
  commentaires: { label: 'Commentaires clients',      desc: 'Nouveaux messages et retours' },
  resume:       { label: 'Résumé quotidien IA',       desc: 'Synthèse chaque matin à 8h' },
  budgets:      { label: 'Dépassements budgétaires',  desc: 'Alerte si > 90% budget consommé' },
  email:        { label: 'Notifications email',       desc: 'Envoyer par email également' },
};

export default function Notifications({ token }: NotificationsProps) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggles, setToggles] = useState<Record<PrefKey, boolean>>({
    delais: true, surcharge: true, commentaires: true,
    resume: true, budgets: true, email: false,
  });
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    setLoading(true);
    getNotifications(token)
      .then((res) => {
        if (active) {
          setItems(res);
          setReadIds(new Set(res.filter((n) => n.read).map((n) => n.id)));
        }
      })
      .catch((err) => { if (active) setError(err.message ?? 'Erreur'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const toggle = (key: PrefKey) => setToggles((t) => ({ ...t, [key]: !t[key] }));
  const markAllRead = () => setReadIds(new Set(items.map((n) => n.id)));
  const isRead = (id: string) => readIds.has(id);

  const unread = items.filter((n) => !isRead(n.id));
  const read = items.filter((n) => isRead(n.id));

  if (loading) return <div className="loading-state">Chargement des notifications…</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ margin: 0 }}>Notifications</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{unread.length} non lues</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Tout marquer lu</button>
      </div>

      <div className="grid-rl">
        <div className="col-stack">
          {unread.length > 0 && (
            <>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px' }}>Non lues</div>
              <div className="card">
                {unread.map((n) => (
                  <div key={n.id} className="notif-item unread" onClick={() => setReadIds((s) => new Set([...s, n.id]))} style={{ cursor: 'pointer' }}>
                    <div className="notif-ico" style={{ background: TYPE_BG[n.type] }}>{TYPE_ICONS[n.type]}</div>
                    <div style={{ flex: 1 }}>
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-desc">{n.description}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <div className="notif-time">{n.timeAgo}</div>
                      <div className="unread-dot" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {items.length === 0 && (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Aucune notification pour le moment.
            </div>
          )}

          {read.length > 0 && (
            <>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px', marginTop: '6px' }}>Lues</div>
              <div className="card">
                {read.map((n) => (
                  <div key={n.id} className="notif-item" style={{ opacity: 0.65 }}>
                    <div className="notif-ico" style={{ background: TYPE_BG[n.type] }}>{TYPE_ICONS[n.type]}</div>
                    <div style={{ flex: 1 }}>
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-desc">{n.description}</div>
                    </div>
                    <div className="notif-time">{n.timeAgo}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="col-stack">
          <div className="card">
            <div className="card-header"><div className="card-title">Préférences de notification</div></div>
            <div style={{ padding: '4px 0' }}>
              {PREF_KEYS.map((key) => (
                <div key={key} className="settings-row">
                  <div className="settings-info">
                    <div className="settings-label">{PREF_LABELS[key].label}</div>
                    <div className="settings-desc">{PREF_LABELS[key].desc}</div>
                  </div>
                  <div className={`toggle ${toggles[key] ? 'on' : ''}`} onClick={() => toggle(key)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
