'use client';

import { useEffect, useRef, useState } from 'react';
import { askAi } from '../lib/api';
import { useTypewriter } from '../lib/useTypewriter';
import type { AiChatMessage } from '../lib/types';

interface ChatWidgetProps {
  token: string;
}

const SUGGESTIONS = [
  'Quels projets sont en retard ?',
  "Quel est l'état du budget global ?",
  'Qui a des tâches en retard ?',
  'Quels sont les risques principaux ?',
];

function TypingDots() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }} className="chat-msg-left">
      <div style={{
        padding: '11px 16px',
        borderRadius: '12px 12px 12px 2px',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
      }}>
        <div className="ai-thinking-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

function AiMessage({ content, isLast }: { content: string; isLast: boolean }) {
  const { displayed, done } = useTypewriter(isLast ? content : '');
  const text = isLast ? displayed : content;

  return (
    <div style={{ maxWidth: '85%', padding: '9px 13px', borderRadius: '12px 12px 12px 2px', background: 'var(--surface2)', color: 'var(--text)', fontSize: '13px', lineHeight: 1.55, border: '1px solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {text}
      {isLast && !done && <span className="tw-cursor" />}
    </div>
  );
}

export default function ChatWidget({ token }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await askAi(token, msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.content }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Erreur de connexion. Vérifiez que le backend est démarré.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input); }
  };

  const lastAiIndex = messages.reduce((acc, m, i) => m.role === 'assistant' ? i : acc, -1);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px',
          boxShadow: open
            ? '0 4px 24px rgba(61,138,255,0.5)'
            : '0 4px 20px rgba(61,138,255,0.35)',
          zIndex: 1000,
          transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s',
          transform: open ? 'scale(1.08) rotate(15deg)' : 'scale(1) rotate(0deg)',
        }}
        title="Assistant NEXUS-IA"
      >
        {open ? '✕' : '✦'}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: 'fixed', bottom: '88px', right: '24px',
            width: '360px', height: '500px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '16px',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
            zIndex: 1000, overflow: 'hidden',
            animation: 'chatPanelIn 0.32s cubic-bezier(0.34,1.26,0.64,1) both',
          }}
        >
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface2)' }}>
            <span className={`ai-badge${loading ? ' ai-badge-pulse' : ''}`}>✦ IA</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>NEXUS-IA</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {loading ? 'En train de réfléchir…' : 'Posez une question sur vos projets'}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Suggestions :</div>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    style={{
                      textAlign: 'left', background: 'var(--surface2)',
                      border: '1px solid var(--border)', borderRadius: '8px',
                      padding: '8px 12px', fontSize: '12px', color: 'var(--text-dim)',
                      cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === 'user' ? 'chat-msg-right' : 'chat-msg-left'}
                style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                {m.role === 'user' ? (
                  <div style={{ maxWidth: '85%', padding: '9px 13px', borderRadius: '12px 12px 2px 12px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff', fontSize: '13px', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {m.content}
                  </div>
                ) : (
                  <AiMessage content={m.content} isLast={i === lastAiIndex && !loading} />
                )}
              </div>
            ))}

            {loading && <TypingDots />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', background: 'var(--surface2)' }}>
            <input
              ref={inputRef}
              className="form-input"
              style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
              placeholder="Posez votre question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => void send(input)}
              disabled={loading || !input.trim()}
              style={{ padding: '8px 14px', flexShrink: 0 }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
