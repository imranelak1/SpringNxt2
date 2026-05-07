'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
  id: number;
  type: 'success' | 'error';
  title: string;
  message?: string;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  tone?: 'warning' | 'danger' | 'info';
}

interface AlertApi {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertApi | null>(null);

export function useAlert(): AlertApi {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used inside AlertProvider');
  return ctx;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

let nextId = 0;

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const timerRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => { setMounted(true); }, []);

  const dismiss = useCallback((id: number) => {
    clearTimeout(timerRef.current[id]);
    delete timerRef.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type: 'success' | 'error', title: string, message?: string) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    timerRef.current[id] = setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const api: AlertApi = {
    success: (title, message) => push('success', title, message),
    error: (title, message) => push('error', title, message),
    confirm: (options) =>
      new Promise<boolean>((resolve) => {
        setConfirm({ ...options, resolve });
      }),
  };

  const handleConfirm = (value: boolean) => {
    confirm?.resolve(value);
    setConfirm(null);
  };

  const toastBg = (type: 'success' | 'error') =>
    type === 'success' ? 'var(--accent)' : 'var(--accent3)';

  return (
    <AlertContext.Provider value={api}>
      {children}

      {mounted &&
        createPortal(
          <>
            {/* Toasts */}
            <div
              style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                zIndex: 9999,
                pointerEvents: 'none',
              }}
            >
              {toasts.map((t) => (
                <div
                  key={t.id}
                  style={{
                    pointerEvents: 'auto',
                    background: 'var(--surface2)',
                    border: `1px solid ${toastBg(t.type)}44`,
                    borderLeft: `3px solid ${toastBg(t.type)}`,
                    borderRadius: '10px',
                    padding: '12px 16px',
                    minWidth: '260px',
                    maxWidth: '360px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                    cursor: 'pointer',
                  }}
                  onClick={() => dismiss(t.id)}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: toastBg(t.type) }}>
                    {t.title}
                  </div>
                  {t.message && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {t.message}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Confirm dialog */}
            {confirm && (
              <div
                className="modal-overlay"
                style={{ zIndex: 10000 }}
                onClick={(e) => e.target === e.currentTarget && handleConfirm(false)}
              >
                <div className="modal" style={{ maxWidth: '400px' }}>
                  <div className="modal-header">
                    <div className="modal-title">{confirm.title}</div>
                  </div>
                  {confirm.message && (
                    <div className="modal-body" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {confirm.message}
                    </div>
                  )}
                  <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={() => handleConfirm(false)}>
                      Annuler
                    </button>
                    <button
                      className={`btn ${confirm.tone === 'warning' || confirm.tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                      onClick={() => handleConfirm(true)}
                    >
                      {confirm.confirmText ?? 'Confirmer'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body,
        )}
    </AlertContext.Provider>
  );
}
