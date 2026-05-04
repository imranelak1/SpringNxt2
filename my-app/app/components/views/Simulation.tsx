'use client';

import { useState } from 'react';
import { simulateProject, createProject, createTask } from '../../lib/api';
import type {
  ProjectSimulationResponse,
  SimPhase,
  View,
} from '../../lib/types';

interface SimulationProps {
  token: string;
  onNavigate: (view: View) => void;
}

type Step = 'form' | 'loading' | 'result';

const DURATIONS = [
  '2 semaines', '1 mois', '2 mois', '3 mois', '6 mois', '1 an',
];

const LOADING_STEPS = [
  'Analyse du périmètre projet…',
  'Définition des phases et livrables…',
  'Estimation des ressources humaines…',
  'Calcul budgétaire détaillé…',
  'Identification des risques…',
  'Génération du plan final…',
];

const PHASE_COLORS = [
  'var(--accent2)',
  'var(--accent)',
  'var(--accent5)',
  'var(--accent4)',
  'var(--accent3)',
];

const RISK_COLORS: Record<string, string> = {
  LOW: 'var(--accent)',
  MEDIUM: 'var(--accent4)',
  HIGH: 'var(--accent3)',
  CRITICAL: '#ff3333',
};

const RISK_BG: Record<string, string> = {
  LOW: 'rgba(79,255,176,0.08)',
  MEDIUM: 'rgba(255,203,71,0.08)',
  HIGH: 'rgba(255,107,107,0.08)',
  CRITICAL: 'rgba(255,51,51,0.1)',
};

const CONFIDENCE_COLOR: Record<string, string> = {
  LOW: 'var(--accent3)',
  MEDIUM: 'var(--accent4)',
  HIGH: 'var(--accent)',
};

function fmt(n: number) {
  return n.toLocaleString('fr-MA', { maximumFractionDigits: 0 });
}

function totalTasks(phases: SimPhase[]) {
  return phases.reduce((s, p) => s + p.tasks.length, 0);
}

function totalHours(phases: SimPhase[]) {
  return phases.reduce((s, p) => s + p.tasks.reduce((h, t) => h + t.estimatedHours, 0), 0);
}

function PhasesTimeline({ phases }: { phases: SimPhase[] }) {
  const totalWeeks = phases.reduce((s, p) => s + p.weeks, 0) || 1;
  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', gap: '3px', height: '36px', borderRadius: '8px', overflow: 'hidden' }}>
        {phases.map((phase, i) => (
          <div
            key={i}
            title={`${phase.name} — ${phase.weeks} sem.`}
            style={{
              flex: phase.weeks / totalWeeks,
              background: PHASE_COLORS[i % PHASE_COLORS.length],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 600, color: '#fff',
              overflow: 'hidden', whiteSpace: 'nowrap', padding: '0 6px',
              opacity: 0.9,
              animation: `insightIn 0.4s cubic-bezier(0.34,1.26,0.64,1) both`,
              animationDelay: `${i * 120}ms`,
            }}
          >
            {phase.weeks}s
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
        {phases.map((phase, i) => (
          <div key={i} style={{ flex: phase.weeks / totalWeeks, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PHASE_COLORS[i % PHASE_COLORS.length], flexShrink: 0 }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{phase.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseCard({ phase, index, defaultOpen }: { phase: SimPhase; index: number; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const color = PHASE_COLORS[index % PHASE_COLORS.length];
  const phaseHours = phase.tasks.reduce((s, t) => s + t.estimatedHours, 0);

  return (
    <div
      style={{
        border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden',
        animation: `insightIn 0.45s cubic-bezier(0.34,1.26,0.64,1) both`,
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div
        style={{
          padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '12px',
          cursor: 'pointer', background: 'var(--surface2)',
          borderBottom: open ? '1px solid var(--border)' : 'none',
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>Phase {index + 1} — {phase.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {phase.weeks} semaine{phase.weeks > 1 ? 's' : ''} · {phase.tasks.length} tâches · {phaseHours}h estimées
          </div>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </div>

      {open && (
        <div>
          {phase.tasks.map((task, ti) => {
            const priBg: Record<string, string> = { CRITICAL: 'rgba(255,51,51,0.1)', HIGH: 'rgba(255,107,107,0.1)', MEDIUM: 'rgba(255,203,71,0.1)', LOW: 'rgba(79,255,176,0.1)' };
            const priColor: Record<string, string> = { CRITICAL: '#ff3333', HIGH: 'var(--accent3)', MEDIUM: 'var(--accent4)', LOW: 'var(--accent)' };
            return (
              <div key={ti} style={{ padding: '10px 16px 10px 38px', borderBottom: ti < phase.tasks.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 500 }}>{task.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{task.role}</div>
                </div>
                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', fontWeight: 600, background: priBg[task.priority] ?? priBg.MEDIUM, color: priColor[task.priority] ?? priColor.MEDIUM }}>{task.priority}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '32px', textAlign: 'right' }}>{task.estimatedHours}h</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Simulation({ token, onNavigate }: SimulationProps) {
  const [step, setStep] = useState<Step>('form');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('3 mois');
  const [teamSize, setTeamSize] = useState('3');
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ProjectSimulationResponse | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const runSimulation = async () => {
    if (!description.trim()) return;
    setStep('loading');
    setError('');
    setLoadingStep(0);

    // Animate loading steps
    const stepInterval = setInterval(() => {
      setLoadingStep((s) => {
        if (s >= LOADING_STEPS.length - 1) { clearInterval(stepInterval); return s; }
        return s + 1;
      });
    }, 1200);

    try {
      const res = await simulateProject(
        token,
        description.trim(),
        budget ? Number(budget) : null,
        duration,
        Number(teamSize) || 3,
      );
      clearInterval(stepInterval);
      setLoadingStep(LOADING_STEPS.length - 1);
      await new Promise((r) => setTimeout(r, 400));
      setResult(res);
      setStep('result');
    } catch (err) {
      clearInterval(stepInterval);
      setError(err instanceof Error ? err.message : 'Simulation échouée.');
      setStep('form');
    }
  };

  const handleCreate = async () => {
    if (!result) return;
    setCreating(true);
    try {
      const project = await createProject(token, {
        name: result.projectName,
        description: result.description,
        status: 'PLANNING',
        startDate: new Date().toISOString().split('T')[0],
        endDate: null,
        budget: result.totalBudget ?? null,
        spentAmount: null,
        progressPercentage: 0,
        githubRepo: null,
      });

      // Create all tasks across all phases
      await Promise.all(
        result.phases.flatMap((phase) =>
          phase.tasks.map((task) =>
            createTask(token, {
              title: task.title,
              description: `Phase: ${phase.name} | Rôle: ${task.role}`,
              status: 'TODO',
              priority: task.priority,
              startDate: null,
              dueDate: null,
              estimatedHours: task.estimatedHours,
              actualHours: null,
              projectId: project.id,
              assigneeId: null,
            }),
          ),
        ),
      );

      setCreated(true);
      setTimeout(() => onNavigate('projets'), 1800);
    } catch {
      setError('Erreur lors de la création du projet.');
    } finally {
      setCreating(false);
    }
  };

  // ── Form ──────────────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '8px 0' }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span className="ai-badge" style={{ fontSize: '12px', padding: '4px 12px' }}>✦ IA</span>
          </div>
          <div className="section-title" style={{ fontSize: '24px', margin: '0 0 8px' }}>Project Studio</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Décrivez votre projet et NEXUS-IA génère un plan complet :<br />phases, tâches, budget, équipe, risques — en quelques secondes.
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '10px', fontSize: '13px', color: 'var(--accent3)' }}>
            {error}
          </div>
        )}

        <div className="card" style={{ padding: '28px' }}>
          <div className="form-group">
            <label className="form-label">Décrivez votre projet *</label>
            <textarea
              className="form-textarea"
              rows={5}
              placeholder="Ex : Une application mobile de livraison de repas avec suivi en temps réel, système de paiement intégré, interface livreur et client, panneau d'administration…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>

          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Budget estimé (MAD)</label>
              <input
                className="form-input"
                type="number"
                placeholder="150 000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Durée cible</label>
              <select className="form-select" value={duration} onChange={(e) => setDuration(e.target.value)}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Taille de l&apos;équipe</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5, 8, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setTeamSize(String(n))}
                  style={{
                    width: '42px', height: '42px', borderRadius: '10px',
                    border: `1.5px solid ${teamSize === String(n) ? 'var(--accent)' : 'var(--border)'}`,
                    background: teamSize === String(n) ? 'rgba(79,255,176,0.1)' : 'var(--surface2)',
                    color: teamSize === String(n) ? 'var(--accent)' : 'var(--text-dim)',
                    fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '14px', justifyContent: 'center' }}
            onClick={() => void runSimulation()}
            disabled={!description.trim()}
          >
            ✦ Simuler le projet avec NEXUS-IA
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div style={{ maxWidth: '520px', margin: '80px auto', textAlign: 'center' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="ai-badge ai-badge-pulse" style={{ fontSize: '13px', padding: '5px 14px' }}>✦ IA</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Simulation en cours…</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>NEXUS-IA analyse votre projet</div>
        </div>

        <div className="ai-card" style={{ textAlign: 'left', padding: '24px' }}>
          {LOADING_STEPS.map((s, i) => {
            const done = i < loadingStep;
            const active = i === loadingStep;
            return (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0',
                  borderBottom: i < LOADING_STEPS.length - 1 ? '1px solid var(--border)' : 'none',
                  opacity: i > loadingStep ? 0.3 : 1,
                  transition: 'opacity 0.3s',
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', background: done ? 'rgba(79,255,176,0.15)' : active ? 'rgba(61,138,255,0.15)' : 'var(--surface2)', border: `1.5px solid ${done ? 'var(--accent)' : active ? 'var(--accent2)' : 'var(--border)'}`, color: done ? 'var(--accent)' : active ? 'var(--accent2)' : 'var(--text-muted)', transition: 'all 0.3s' }}>
                  {done ? '✓' : active ? '⟳' : String(i + 1)}
                </div>
                <span style={{ fontSize: '13px', color: done ? 'var(--text)' : active ? 'var(--accent2)' : 'var(--text-muted)', fontWeight: active ? 500 : 400 }}>{s}</span>
                {active && (
                  <div className="ai-thinking-dots" style={{ marginLeft: 'auto' }}>
                    <span /><span /><span />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────
  if (!result) return null;

  if (created) {
    return (
      <div style={{ maxWidth: '480px', margin: '120px auto', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Projet créé avec succès !</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Redirection vers les projets…</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="ai-badge">✦ IA</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, background: RISK_BG[result.confidence] ?? RISK_BG.MEDIUM, color: CONFIDENCE_COLOR[result.confidence] ?? 'var(--text-muted)' }}>
              Confiance {result.confidence}
            </span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px' }}>{result.projectName}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: '600px' }}>{result.description}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setStep('form'); setResult(null); setCreated(false); }}>
            ↩ Nouvelle
          </button>
          <button
            className="btn btn-primary"
            style={{ gap: '6px' }}
            onClick={() => void handleCreate()}
            disabled={creating}
          >
            {creating ? 'Création…' : '⚡ Créer ce projet'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '8px', fontSize: '12px', color: 'var(--accent3)' }}>
          {error}
        </div>
      )}

      {/* Stats row */}
      <div className="stats-row" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Durée estimée', val: `${result.estimatedWeeks} sem.`, cls: 'sc1' },
          { label: 'Budget total', val: `${fmt(result.totalBudget)} MAD`, cls: 'sc2' },
          { label: 'Tâches', val: String(totalTasks(result.phases)), cls: 'sc3' },
          { label: 'Heures totales', val: `${totalHours(result.phases)}h`, cls: 'sc4' },
        ].map(({ label, val, cls }) => (
          <div key={label} className={`stat-card ${cls}`} style={{ animation: 'insightIn 0.4s cubic-bezier(0.34,1.26,0.64,1) both' }}>
            <div className="stat-lbl">{label}</div>
            <div className="stat-val" style={{ fontSize: '22px' }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="grid-lr" style={{ gap: '20px' }}>
        {/* Left column */}
        <div className="col-stack">
          {/* Timeline */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="card-title" style={{ marginBottom: '16px' }}>Planning des phases</div>
            <PhasesTimeline phases={result.phases} />
          </div>

          {/* Phases breakdown */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
              {result.phases.length} Phases · {totalTasks(result.phases)} tâches
            </div>
            <div className="col-stack" style={{ gap: '8px' }}>
              {result.phases.map((phase, i) => (
                <PhaseCard key={i} phase={phase} index={i} defaultOpen={i === 0} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-stack">
          {/* Budget */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="card-title" style={{ marginBottom: '14px' }}>Budget par poste</div>
            {result.budgetBreakdown.map((item, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12.5px' }}>{item.category}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fmt(item.amount)} MAD</span>
                </div>
                <div style={{ height: '8px', background: 'var(--surface2)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '10px',
                    background: PHASE_COLORS[i % PHASE_COLORS.length],
                    width: `${item.percentage}%`,
                    animation: `budgetFill 0.8s cubic-bezier(0.34,1.1,0.64,1) both`,
                    animationDelay: `${i * 100}ms`,
                  }} />
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>{item.percentage}%</div>
              </div>
            ))}
          </div>

          {/* Team */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="card-title" style={{ marginBottom: '14px' }}>Équipe recommandée</div>
            {result.teamRoles.map((role, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < result.teamRoles.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="av" style={{ width: '28px', height: '28px', fontSize: '10px', background: `linear-gradient(135deg, ${PHASE_COLORS[i % PHASE_COLORS.length]}, ${PHASE_COLORS[(i + 1) % PHASE_COLORS.length]})` }}>
                  {role.role.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 500 }}>{role.role}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{role.allocationPercentage}% allocation</div>
                </div>
                <span className="badge b-gray">{role.count}×</span>
              </div>
            ))}
          </div>

          {/* Risks */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="card-title" style={{ marginBottom: '14px' }}>Risques identifiés</div>
            {result.risks.map((risk, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: '8px', background: RISK_BG[risk.level] ?? RISK_BG.MEDIUM, border: `1px solid ${RISK_COLORS[risk.level] ?? 'var(--border)'}22`, marginBottom: i < result.risks.length - 1 ? '8px' : 0, animation: `insightIn 0.4s cubic-bezier(0.34,1.26,0.64,1) both`, animationDelay: `${i * 80}ms` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: RISK_COLORS[risk.level] ?? 'var(--text-muted)', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: RISK_COLORS[risk.level] }}>{risk.level}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text)' }}>{risk.title}</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', lineHeight: 1.5, paddingLeft: '13px' }}>{risk.description}</div>
              </div>
            ))}
          </div>

          {/* AI insights */}
          <div className="ai-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="ai-badge">✦ IA</span>
              <span className="ai-title">Recommandations clés</span>
            </div>
            {result.keyInsights.map((insight, i) => (
              <div key={i} className="ai-insight ai-insight-animated" style={{ animationDelay: `${i * 100}ms` }}>
                <span className="insight-ico">{['💡', '🎯', '⚠', '📌'][i] ?? '•'}</span>
                <div className="insight-txt">{insight}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
