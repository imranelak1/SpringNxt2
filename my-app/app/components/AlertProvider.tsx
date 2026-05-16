'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

type AlertType = 'success' | 'error';

interface Toast {
  id: number;
  type: AlertType;
  title: string;
  message?: string;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  tone?: 'warning' | 'danger' | 'info';
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface AlertApi {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertApi | null>(null);

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used inside AlertProvider');
  return ctx;
}

let nextId = 0;

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const timerRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: number) => {
    clearTimeout(timerRef.current[id]);
    delete timerRef.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: AlertType, title: string, message?: string) => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, type, title, message }]);

      timerRef.current[id] = setTimeout(() => {
        dismiss(id);
      }, 4000);
    },
    [dismiss],
  );

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

  const toastColor = (type: AlertType) =>
    type === 'success' ? '#f59e0b' : '#ef4444';

  const toastBackground = (type: AlertType) =>
    type === 'success' ? 'rgba(245, 158, 11, 0.14)' : 'rgba(239, 68, 68, 0.12)';

  return (
    <AlertContext.Provider value={api}>
      {children}

      {mounted &&
        createPortal(
          <>
            {/* TOASTS */}
            <div
              style={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                zIndex: 9999,
              }}
            >
              {toasts.map((t) => (
                <div
                  key={t.id}
                  onClick={() => dismiss(t.id)}
                  style={{
                    background: toastBackground(t.type),
                    color: 'white',
                    padding: '14px 16px',
                    borderRadius: 16,
                    borderLeft: `5px solid ${toastColor(t.type)}`,
                    cursor: 'pointer',
                    minWidth: 280,
                    maxWidth: 360,
                    boxShadow: '0 18px 45px rgba(15, 23, 42, 0.35)',
                    backdropFilter: 'blur(6px)',
                    overflowWrap: 'anywhere',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.01em' }}>
                    {t.title}
                  </div>
                  {t.message && (
                    <div style={{ marginTop: 6, fontSize: 13, opacity: 0.84, lineHeight: 1.45 }}>
                      {t.message}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CONFIRM */}
            {confirm && (
              <div
                onClick={(e) =>
                  e.target === e.currentTarget && handleConfirm(false)
                }
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(12, 18, 36, 0.82)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10000,
                }}
              >
                <div
                  style={{
                    background: '#0f172a',
                    padding: 26,
                    borderRadius: 20,
                    width: 380,
                    maxWidth: 'calc(100vw - 40px)',
                    color: 'white',
                    boxShadow: '0 32px 80px rgba(15, 23, 42, 0.45)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                  }}
                >
                  <h3 style={{ fontSize: 18, margin: 0, lineHeight: 1.3 }}>
                    {confirm.title}
                  </h3>

                  {confirm.message && (
                    <p style={{ marginTop: 12, fontSize: 14, opacity: 0.82, lineHeight: 1.6 }}>
                      {confirm.message}
                    </p>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 12,
                      marginTop: 24,
                    }}
                  >
                    <button
                      onClick={() => handleConfirm(false)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        border: '1px solid rgba(148, 163, 184, 0.18)',
                        background: 'transparent',
                        color: '#e2e8f0',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleConfirm(true)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 12,
                        border: 'none',
                        background: '#38bdf8',
                        color: '#0f172a',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
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