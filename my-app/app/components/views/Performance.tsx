'use client';

import { useEffect, useState } from 'react';
import { getPerformance } from '../../lib/api';
import type { MemberPerformance, PerformanceResponse } from '../../lib/types';

interface PerformanceProps {
  token: string;
}

const GRADE_COLORS: Record<string, string> = {
  'A+': 'var(--accent)',
  'A': 'var(--accent)',
  'B+': 'var(--accent4)',
  'B': 'var(--accent4)',
  'C': 'var(--accent3)',
};

const BAR_COLORS = [
  'var(--accent2)',
  'rgba(61,138,255,0.4)',
  'rgba(61,138,255,0.3)',
  'rgba(79,255,176,0.25)',
  'var(--surface2)',
  'var(--surface2)',
  'var(--surface2)',
];

function initials(m: MemberPerformance) {
  return `${m.firstName[0] ?? ''}${m.lastName[0] ?? ''}`.toUpperCase();
}

export default function Performance({ token }: PerformanceProps) {
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPerformance(token)
      .then((res) => { if (active) setData(res); })
      .catch((err) => { if (active) setError(err.message ?? 'Erreur'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  if (loading) return <div className="loading-state">Chargement des performances…</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!data) return null;

  const maxWeekly = Math.max(1, ...data.weeklyCompletedTasks.map((w) => w.count));

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div className="section-title">Performance globale</div>
        <div className="section-sub">Indicateurs clés basés sur les données réelles</div>
      </div>

      <div className="stats-row">
        <div className="stat-card sc1">
          <div className="stat-lbl">Vélocité équipe</div>
          <div className="stat-val">{data.teamVelocity}</div>
          <div className="stat-chg">Score /100</div>
        </div>
        <div className="stat-card sc2">
          <div className="stat-lbl">Taux livraison</div>
          <div className="stat-val">{data.deliveryRate}%</div>
          <div className="stat-chg">Tâches complétées</div>
        </div>
        <div className="stat-card sc3">
          <div className="stat-lbl">Score santé moy.</div>
          <div className="stat-val">{data.avgHealthScore}</div>
          <div className="stat-chg">Score /100</div>
        </div>
        <div className="stat-card sc4">
          <div className="stat-lbl">Tâches en retard</div>
          <div className="stat-val">{data.overdueTaskCount}</div>
          <div className="stat-chg down">{data.overdueTaskCount > 0 ? '⚠ Action requise' : '✓ À jour'}</div>
        </div>
      </div>

      <div className="grid-2 mb18">
        <div className="card">
          <div className="card-header"><div className="card-title">Tâches complétées par semaine</div></div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
              {data.weeklyCompletedTasks.map((w, i) => {
                const heightPct = maxWeekly === 0 ? 0 : Math.round((w.count / maxWeekly) * 100);
                const isLast = i === data.weeklyCompletedTasks.length - 1;
                const bg = isLast
                  ? 'linear-gradient(180deg,var(--accent),var(--accent2))'
                  : BAR_COLORS[i] ?? 'var(--surface2)';
                return (
                  <div key={w.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '100%', background: bg, height: `${heightPct}px`, borderRadius: '4px 4px 0 0', minHeight: w.count > 0 ? '4px' : '0' }} />
                    <div style={{ fontSize: '10px', color: isLast ? 'var(--accent)' : 'var(--text-muted)' }}>{w.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Moy : <strong style={{ color: 'var(--text)' }}>
                  {data.weeklyCompletedTasks.length
                    ? Math.round(data.weeklyCompletedTasks.reduce((s, w) => s + w.count, 0) / data.weeklyCompletedTasks.length)
                    : 0} tâches/sem
                </strong>
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Max : <strong style={{ color: 'var(--accent)' }}>{maxWeekly} tâches</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Performance par membre</div></div>
          {data.memberStats.length === 0 ? (
            <div style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Aucune tâche assignée pour le moment.
            </div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Membre</th><th>Tâches</th><th>À temps</th><th>Score</th></tr></thead>
              <tbody>
                {data.memberStats.map((m) => (
                  <tr key={m.userId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="av" style={{ width: '26px', height: '26px', fontSize: '10px' }}>{initials(m)}</div>
                        <span style={{ fontSize: '13px' }}>{m.firstName} {m.lastName[0]}.</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{m.totalTasks}</td>
                    <td>
                      <span className={`badge ${m.onTimeRate >= 90 ? 'b-green' : m.onTimeRate >= 75 ? 'b-yellow' : 'b-red'}`}>
                        {m.onTimeRate}%
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontSize: '14px', fontWeight: 700, color: GRADE_COLORS[m.grade] ?? 'var(--text)' }}>
                      {m.grade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="ai-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="ai-badge">✦ IA</span>
          <span className="ai-title">Analyse de performance</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
          {data.memberStats.filter((m) => m.grade === 'A+' || m.grade === 'A').slice(0, 1).map((m) => (
            <div key={m.userId} className="ai-insight">
              <span className="insight-ico">🔺</span>
              <div className="insight-txt">
                <strong>{m.firstName} {m.lastName}</strong> — performance excellente ({m.onTimeRate}% à temps).
              </div>
            </div>
          ))}
          {data.memberStats.filter((m) => m.grade === 'C').slice(0, 1).map((m) => (
            <div key={m.userId} className="ai-insight">
              <span className="insight-ico">⚠</span>
              <div className="insight-txt">
                <strong>{m.firstName} {m.lastName}</strong> — taux de livraison à améliorer ({m.onTimeRate}%).
              </div>
            </div>
          ))}
          <div className="ai-insight">
            <span className="insight-ico">🎯</span>
            <div className="insight-txt">
              Objectif : atteindre <strong>90%+</strong> de taux de livraison. Taux actuel : <strong>{data.deliveryRate}%</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
