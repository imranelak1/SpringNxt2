'use client';

import { useEffect, useState } from 'react';
import { getReports, askAi } from '../../lib/api';
import { archiveAiGeneration } from '../../lib/aiArchive';
import { useTypewriter } from '../../lib/useTypewriter';
import type { ReportsResponse } from '../../lib/types';

async function exportPdf(data: ReportsResponse, aiText: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 18;
  const col = W - margin * 2;
  let y = 20;

  const line = (text: string, size: number, color: [number, number, number], bold = false) => {
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(text, margin, y);
    y += size * 0.45 + 2;
  };

  const rule = (r = 200, g = 200, b = 200) => {
    doc.setDrawColor(r, g, b);
    doc.line(margin, y, W - margin, y);
    y += 5;
  };

  // Header
  doc.setFillColor(15, 17, 26);
  doc.rect(0, 0, W, 36, 'F');
  doc.setFontSize(18);
  doc.setTextColor(79, 255, 176);
  doc.setFont('helvetica', 'bold');
  doc.text('SpringNxt — Rapport Portfolio', margin, 16);
  doc.setFontSize(9);
  doc.setTextColor(160, 165, 190);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date())}`, margin, 26);
  y = 46;

  // KPIs
  line('Synthèse globale', 13, [79, 255, 176], true);
  y += 2;
  const kpis = [
    ['Total projets', String(data.totalProjects)],
    ['Projets actifs', String(data.activeProjects)],
    ['Projets livrés', String(data.completedProjects)],
    ['Taux complétion tâches', `${data.deliveryRate}%`],
    ['Score santé moyen', `${data.avgHealthScore}/100`],
    ['Total tâches', String(data.totalTasks)],
    ['Tâches terminées', String(data.completedTasks)],
  ];
  kpis.forEach(([label, val]) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 155, 180);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(230, 232, 245);
    doc.text(val, margin + 80, y);
    y += 7;
  });
  y += 3;
  rule();

  // Status breakdown
  line('Répartition par statut', 13, [79, 255, 176], true);
  y += 2;
  data.projectsByStatus.forEach(({ status, count }) => {
    const pct = data.totalProjects === 0 ? 0 : Math.round((count / data.totalProjects) * 100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 155, 180);
    doc.text(status, margin, y);
    doc.setFillColor(40, 44, 64);
    doc.roundedRect(margin + 40, y - 4, col - 40, 5, 1, 1, 'F');
    doc.setFillColor(61, 138, 255);
    if (pct > 0) doc.roundedRect(margin + 40, y - 4, (col - 40) * pct / 100, 5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(230, 232, 245);
    doc.text(`${count}`, W - margin, y, { align: 'right' });
    y += 8;
  });
  y += 3;
  rule();

  // AI analysis
  if (aiText) {
    line('Analyse IA', 13, [79, 255, 176], true);
    y += 2;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 205, 225);
    const wrapped = doc.splitTextToSize(aiText, col);
    wrapped.forEach((l: string) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(l, margin, y);
      y += 6;
    });
  }

  doc.save(`rapport-portfolio-${new Date().toISOString().slice(0, 10)}.pdf`);
}

interface RapportsProps {
  token: string;
}

export default function Rapports({ token }: RapportsProps) {
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoaded, setAiLoaded] = useState(false);
  const [aiValidated, setAiValidated] = useState(false);
  const { displayed: typedText, done: typingDone } = useTypewriter(aiLoaded ? aiText : '');

  const generateAnalysis = (reportData: ReportsResponse) => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiLoaded(false);
    setAiValidated(false);
    const prompt = `Génère une analyse narrative complète du portfolio de projets en 4 points clés. Données : ${reportData.totalProjects} projets (${reportData.activeProjects} actifs, ${reportData.completedProjects} livrés), taux de complétion tâches : ${reportData.deliveryRate}%, score santé moyen : ${reportData.avgHealthScore}/100, ${reportData.totalTasks} tâches dont ${reportData.completedTasks} terminées. Sois direct, factuel et professionnel.`;
    askAi(token, prompt)
      .then((res) => { setAiText(res.content); setAiLoaded(true); })
      .catch(() => { setAiText('Analyse IA indisponible.'); setAiLoaded(true); })
      .finally(() => setAiLoading(false));
  };

  const validateReportAnalysis = () => {
    archiveAiGeneration({
      type: 'report-analysis',
      title: 'Analyse intelligente',
      payload: { content: aiText },
    });
    setAiValidated(true);
  };

  useEffect(() => {
    let active = true;
    getReports(token)
      .then((res) => { if (active) setData(res); })
      .catch((err) => { if (active) setError(err.message ?? 'Erreur'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  if (loading) return <div className="loading-state">Chargement des rapports…</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!data) return null;

  const maxMonthly = Math.max(1, ...data.monthlyProjectCounts.map((m) => m.count));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ margin: 0 }}>Rapports &amp; Analyses</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Générés automatiquement à partir des données réelles</div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => void exportPdf(data, aiText)}
          title="Exporter en PDF"
        >
          ↓ PDF
        </button>
      </div>

      <div className="grid-lr">
        <div className="col-stack">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Synthèse globale</div>
              <span className="badge b-green">Données réelles</span>
            </div>
            <div className="card-body">
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '16px' }}>
                <strong style={{ color: 'var(--text)' }}>{data.totalProjects} projets</strong> au total,
                dont <strong style={{ color: 'var(--accent)' }}>{data.activeProjects} actifs</strong> et{' '}
                <strong style={{ color: 'var(--accent2)' }}>{data.completedProjects} livrés</strong>.
                Taux de complétion des tâches :{' '}
                <strong style={{ color: 'var(--accent)' }}>{data.deliveryRate}%</strong>.
                Score santé moyen :{' '}
                <strong style={{ color: 'var(--accent4)' }}>{data.avgHealthScore}/100</strong>.
              </div>
              <div className="divider" />
              <div className="gauge-row">
                <div className="gauge-item">
                  <div className="gauge-val" style={{ color: 'var(--accent)' }}>{data.deliveryRate}%</div>
                  <div className="gauge-lbl">Tâches complétées</div>
                </div>
                <div className="gauge-item">
                  <div className="gauge-val" style={{ color: 'var(--accent2)' }}>{data.avgHealthScore}</div>
                  <div className="gauge-lbl">Score santé /100</div>
                </div>
                <div className="gauge-item">
                  <div className="gauge-val" style={{ color: 'var(--accent4)' }}>{data.completedProjects}</div>
                  <div className="gauge-lbl">Projets livrés</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Projets créés par mois</div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>6 derniers mois</span>
            </div>
            <div style={{ padding: '16px 20px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '90px', marginBottom: '8px' }}>
                {data.monthlyProjectCounts.map(({ label, count }, i) => {
                  const isLast = i === data.monthlyProjectCounts.length - 1;
                  const heightPx = maxMonthly === 0 ? 0 : Math.round((count / maxMonthly) * 80);
                  const bg = isLast
                    ? 'linear-gradient(180deg,var(--accent),var(--accent2))'
                    : i === data.monthlyProjectCounts.length - 2
                    ? 'rgba(61,138,255,0.4)'
                    : 'var(--surface2)';
                  return (
                    <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '100%', background: bg, height: `${heightPx}px`, borderRadius: '5px 5px 0 0', minHeight: count > 0 ? '4px' : '0' }} />
                      <span style={{ fontSize: '10px', color: isLast ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'capitalize' }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Répartition par statut</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {data.projectsByStatus.map(({ status, count }) => {
                const pct = data.totalProjects === 0 ? 0 : Math.round((count / data.totalProjects) * 100);
                return (
                  <div key={status} className="bud-row">
                    <div className="bud-label">{status}</div>
                    <div className="bud-bar">
                      <div className="bud-fill" style={{ width: `${pct}%`, background: 'var(--accent2)' }} />
                    </div>
                    <div className="bud-val" style={{ color: 'var(--accent2)' }}>{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-stack">
          <div className={`ai-card${aiLoading ? ' ai-scan-wrap' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className={`ai-badge${aiLoading ? ' ai-badge-pulse' : ''}`}>✦ IA</span>
              <span className="ai-title">Analyse intelligente</span>
              {!aiLoaded && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginLeft: 'auto', fontSize: '11px' }}
                  onClick={() => generateAnalysis(data)}
                  disabled={aiLoading}
                >
                  {aiLoading ? '…' : 'Générer'}
                </button>
              )}
{aiLoaded && (
  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span className={`badge ${aiValidated ? 'b-green' : 'b-yellow'}`}>
      {aiValidated ? 'Archivee' : 'A valider'}
    </span>

    {typingDone && (
      <button
        className="btn btn-ghost btn-sm"
        style={{ fontSize: '11px' }}
        onClick={() => void exportPdf(data, aiText)}
      >
        ↓ Exporter PDF
      </button>
    )}
  </div>
)}
             
            </div>
            {!aiLoaded && !aiLoading && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Cliquez sur <strong>Générer</strong> pour obtenir une analyse narrative IA du portfolio.
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
                  <button className="btn btn-ghost btn-sm" onClick={() => generateAnalysis(data)} disabled={aiLoading}>
                    Regenerer
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={validateReportAnalysis} disabled={aiValidated || !typingDone}>
                    {aiValidated ? 'Valide et archive' : 'Valider'}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Résumé des tâches</div></div>
            <div style={{ padding: '16px 20px' }}>
              {[
                { label: 'Complétées', count: data.completedTasks, color: 'var(--accent)' },
                { label: 'En cours', count: data.totalTasks - data.completedTasks, color: 'var(--accent2)' },
              ].map(({ label, count, color }) => {
                const pct = data.totalTasks === 0 ? 0 : Math.round((count / data.totalTasks) * 100);
                return (
                  <div key={label} className="bud-row">
                    <div className="bud-label">{label}</div>
                    <div className="bud-bar">
                      <div className="bud-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <div className="bud-val" style={{ color }}>{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
