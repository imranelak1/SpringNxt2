'use client';

import { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/api';
import type { AppNotification, View } from '../../lib/types';

interface NotificationsProps {
  token: string;
  onNavigate: (view: View) => void;
}

const typeIcon: Record<string, string> = {
  TASK_ASSIGNED: '📋',
  TASK_STATUS_CHANGED: '🔄',
  PROJECT_MEMBER_ADDED: '👥',
  PROJECT_STATUS_CHANGED: '📁',
  GITHUB_PUSH: '⬆',
  GITHUB_PR: '⤵',
};

const typeColor: Record<string, string> = {
  TASK_ASSIGNED: 'rgba(61,138,255,0.1)',
  TASK_STATUS_CHANGED: 'rgba(167,139,250,0.1)',
  PROJECT_MEMBER_ADDED: 'rgba(79,255,176,0.1)',
  PROJECT_STATUS_CHANGED: 'rgba(255,203,71,0.1)',
  GITHUB_PUSH: 'rgba(255,255,255,0.06)',
  GITHUB_PR: 'rgba(255,255,255,0.06)',
};

function formatTime(createdAt: string) {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
}

export default function Notifications({ token, onNavigate }: NotificationsProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getNotifications(token);
        if (isMounted) setNotifications(data);
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : 'Unable to load notifications.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();
    return () => { isMounted = false; };
  }, [token]);

  const handleMarkRead = async (n: AppNotification) => {
    try {
      if (!n.read) {
        await markNotificationRead(token, n.id);
        setNotifications((current) =>
          current.map((item) => (item.id === n.id ? { ...item, read: true } : item))
        );
      }
      if (n.link) {
        onNavigate(n.link as View);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(token);
      setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ margin: 0 }}>Notifications</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {loading ? 'Loading...' : `${unread.length} unread`}
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => void handleMarkAllRead()}
          disabled={markingAll || unread.length === 0}
        >
          Mark all read
        </button>
      </div>

      {error ? (
        <div className="card">
          <div className="card-body" style={{ color: 'var(--accent3)' }}>{error}</div>
        </div>
      ) : loading ? (
        <div className="card">
          <div className="card-body" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            No notifications yet. They will appear here when tasks are assigned to you or project statuses change.
          </div>
        </div>
      ) : (
        <div className="col-stack">
          {unread.length > 0 && (
            <>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Unread
              </div>
              <div className="card">
                {unread.map((n) => (
                  <div
                    key={n.id}
                    className="notif-item unread"
                    onClick={() => void handleMarkRead(n)}
                    style={{ cursor: n.link ? 'pointer' : 'default' }}
                  >
                    <div className="notif-ico" style={{ background: typeColor[n.type] ?? 'rgba(255,255,255,0.05)' }}>
                      {typeIcon[n.type] ?? '🔔'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-desc">{n.body}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <div className="notif-time">{formatTime(n.createdAt)}</div>
                      <div className="unread-dot"></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {read.length > 0 && (
            <>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px', marginTop: '6px' }}>
                Read
              </div>
              <div className="card">
                {read.map((n) => (
                  <div
                    key={n.id}
                    className="notif-item"
                    style={{ opacity: 0.65, cursor: n.link ? 'pointer' : 'default' }}
                    onClick={() => n.link && onNavigate(n.link as View)}
                  >
                    <div className="notif-ico" style={{ background: typeColor[n.type] ?? 'rgba(255,255,255,0.05)' }}>
                      {typeIcon[n.type] ?? '🔔'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-desc">{n.body}</div>
                    </div>
                    <div className="notif-time">{formatTime(n.createdAt)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
