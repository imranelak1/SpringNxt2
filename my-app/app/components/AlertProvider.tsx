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
    type === 'success' ? '#22c55e' : '#ef4444';

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
                    background: '#1f1f1f',
                    color: 'white',
                    padding: '12px 14px',
                    borderRadius: 10,
                    borderLeft: `4px solid ${toastColor(t.type)}`,
                    cursor: 'pointer',
                    minWidth: 240,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {t.title}
                  </div>
                  {t.message && (
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
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
                  background: 'rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10000,
                }}
              >
                <div
                  style={{
                    background: '#111',
                    padding: 20,
                    borderRadius: 12,
                    width: 360,
                    color: 'white',
                  }}
                >
                  <h3>{confirm.title}</h3>

                  {confirm.message && (
                    <p style={{ fontSize: 13, opacity: 0.7 }}>
                      {confirm.message}
                    </p>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 10,
                      marginTop: 20,
                    }}
                  >
                    <button onClick={() => handleConfirm(false)}>
                      Cancel
                    </button>
                    <button onClick={() => handleConfirm(true)}>
                      {confirm.confirmText ?? 'Confirm'}
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