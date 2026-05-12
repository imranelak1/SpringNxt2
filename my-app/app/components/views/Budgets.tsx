'use client';

import { useEffect, useState } from 'react';
import { getBudget, askAi } from '../../lib/api';
import { archiveAiGeneration } from '../../lib/aiArchive';
import { useTypewriter } from '../../lib/useTypewriter';
import type { BudgetProjectItem, BudgetResponse } from '../../lib/types';

interface BudgetsProps {
  token: string;
}

function statusBadge(item: BudgetProjectItem) {
  if (item.overBudget) return <span className="badge b-red">⚠ Dépassé</span>;
  if (item.progressPercentage >= 90) return <span className="badge b-yellow">Surveiller</span>;
  if (item.status === 'COMPLETED') return <span className="badge b-blue">Livré ✓</span>;
  if (item.status === 'ON_HOLD') return <span className="badge b-gray">En pause</span>;
  return <span className="badge b-green">✓ Normal</span>;
}

function fmt(n: number) {
  return n.toLocaleString('fr-MA', { maximumFractionDigits: 0 });
}

function spentPct(item: BudgetProjectItem) {
  if (item.budgetAllocated === 0) return 0;
  return Math.min(100, Math.round((item.budgetSpent / item.budgetAllocated) * 100));
}

export default function Budgets({ token }: BudgetsProps) {
  const [data, setData] = useState<BudgetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoaded, setAiLoaded] = useState(false);
  const [aiValidated, setAiValidated] = useState(false);
  const { displayed: typedText, done: typingDone } = useTypewriter(aiLoaded ? aiText : '');

  const generateBudgetAnalysis = (budgetData: BudgetResponse) => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiLoaded(false);
    setAiValidated(false);
    const overProjects = budgetData.projects.filter((p) => p.overBudget).map((p) => p.projectName).join(', ');
    const prompt = `Analyse le budget du portfolio. Budget total : ${budgetData.totalBudget} MAD, dépensé : ${budgetData.totalSpent} MAD, restant : ${budgetData.totalRemaining} MAD, ${budgetData.overBudgetCount} projet(s) en dépassement${overProjects ? ` (${overProjects})` : ''}. Génère 3 alertes ou recommandations concrètes en 2-3 lignes chacune. Sois direct et professionnel.`;
    askAi(token, prompt)
      .then((res) => { setAiText(res.content); setAiLoaded(true); })
      .catch(() => { setAiText('Analyse IA indisponible.'); setAiLoaded(true); })
      .finally(() => setAiLoading(false));
  };

  const validateBudgetAnalysis = () => {
    archiveAiGeneration({
      type: 'budget-analysis',
      title: 'Analyse budgetaire IA',
      payload: { content: aiText },
    });
    setAiValidated(true);
  };

  useEffect(() => {
    let active = true;
    getBudget(token)
      .then((res) => { if (active) setData(res); })
      .catch((err) => { if (active) setError(err.message ?? 'Erreur'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  if (loading) return <div className="loading-state">Chargement des budgets…</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!data || data.projects.length === 0) {
    return (
      <div>
        <div className="section-title">Suivi des budgets</div>
        <div className="empty-state">Aucun projet avec budget défini.</div>
      </div>
    );
  }

  const totalPct = data.totalBudget > 0
    ? Math.round((data.totalSpent / data.totalBudget) * 100)
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ margin: 0 }}>Suivi des budgets</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Budget total alloué : {fmt(data.totalBudget)} MAD
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card sc1">
          <div className="stat-lbl">Budget total</div>
          <div className="stat-val">{fmt(data.totalBudget / 1000)}k</div>
          <div className="stat-chg">MAD alloués</div>
        </div>
        <div className="stat-card sc3">
          <div className="stat-lbl">Consommé</div>
          <div className="stat-val">{fmt(data.totalSpent / 1000)}k</div>
          <div className="stat-chg down">{totalPct}% du total</div>
        </div>
        <div className="stat-card sc2">
          <div className="stat-lbl">Restant</div>
          <div className="stat-val">{fmt(Math.max(0, data.totalRemaining) / 1000)}k</div>
          <div className="stat-chg up">{100 - totalPct}% disponible</div>
        </div>
        <div className="stat-card sc4">
          <div className="stat-lbl">Dépassements</div>
          <div className="stat-val">{data.overBudgetCount}</div>
          <div className="stat-chg down">
            {data.overBudgetCount > 0 ? '⚠ Budget(s) dépassé(s)' : '✓ Sous contrôle'}
          </div>
        </div>
      </div>

      <div className="grid-lr">
        <div className="card">
          <div className="card-header"><div className="card-title">Budget par projet</div></div>
          <table className="tbl">
            <thead>
              <tr><th>Projet</th><th>Alloué</th><th>Consommé</th><th>Restant</th><th>État</th></tr>
            </thead>
            <tbody>
              {data.projects.map((item) => {
                const pct = spentPct(item);
                const barColor = item.overBudget ? 'var(--accent3)' : pct >= 90 ? 'var(--accent4)' : undefined;
                return (
                  <tr key={item.projectId}>
                    <td style={{ fontSize: '13px', fontWeight: 500 }}>{item.projectName}</td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>{fmt(item.budgetAllocated)} MAD</td>
                    <td>
                      <div className="pbar-wrap">
                        <div className="pbar">
                          <div className="pfill" style={{ width: `${pct}%`, ...(barColor ? { background: barColor } : {}) }} />
                        </div>
                        <span style={{ fontSize: '12px', minWidth: '75px', ...(item.overBudget ? { color: 'var(--accent3)' } : {}) }}>
                          {fmt(item.budgetSpent)} MAD
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12.5px', color: item.overBudget ? 'var(--accent3)' : 'var(--accent)' }}>
                      {item.overBudget ? '−' : ''}{fmt(Math.abs(item.budgetRemaining))} MAD
                    </td>
                    <td>{statusBadge(item)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="col-stack">
          <div className="card">
            <div className="card-header"><div className="card-title">Répartition par état</div></div>
            <div style={{ padding: '16px 20px' }}>
              {data.projects.map((item) => {
                const pct = spentPct(item);
                return (
                  <div key={item.projectId} className="bud-row">
                    <div className="bud-label">{item.projectName}</div>
                    <div className="bud-bar">
                      <div className="bud-fill" style={{ width: `${pct}%`, background: item.overBudget ? 'var(--accent3)' : 'var(--accent2)' }} />
                    </div>
                    <div className="bud-val" style={{ color: item.overBudget ? 'var(--accent3)' : 'var(--accent2)' }}>
                      {fmt(item.budgetSpent)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`ai-card${aiLoading ? ' ai-scan-wrap' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className={`ai-badge${aiLoading ? ' ai-badge-pulse' : ''}`}>✦ IA</span>
              <span className="ai-title">Analyse budgétaire IA</span>
              {!aiLoaded && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginLeft: 'auto', fontSize: '11px' }}
                  onClick={() => generateBudgetAnalysis(data)}
                  disabled={aiLoading}
                >
                  {aiLoading ? '…' : 'Analyser'}
                </button>
              )}
              {aiLoaded && (
                <span className={`badge ${aiValidated ? 'b-green' : 'b-yellow'}`} style={{ marginLeft: 'auto' }}>
                  {aiValidated ? 'Archivee' : 'A valider'}
                </span>
              )}
            </div>
            {!aiLoaded && !aiLoading && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Cliquez sur <strong>Analyser</strong> pour une analyse IA de vos budgets et dépassements.
              </div>
            )}
            {aiLoading && (
              <div className="ai-thinking">
                <div className="ai-thinking-dots"><span /><span /><span /></div>
                <span className="ai-thinking-label">Analyse en cours…</span>
              </div>
            )}
            {aiLoaded && (
              <>
                <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {typedText}
                  {!typingDone && <span className="tw-cursor" />}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => generateBudgetAnalysis(data)} disabled={aiLoading}>
                    Regenerer
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={validateBudgetAnalysis} disabled={aiValidated || !typingDone}>
                    {aiValidated ? 'Valide et archive' : 'Valider'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
