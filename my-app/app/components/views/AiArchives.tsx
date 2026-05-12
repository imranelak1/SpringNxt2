'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAlert } from '../AlertProvider';
import { deleteAiArchive, getAiArchive, type AiArchiveItem } from '../../lib/aiArchive';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    'dashboard-insights': 'Dashboard',
    'project-risk': 'Risque projet',
    'project-simulation': 'Simulation',
    'pdf-import': 'Import PDF',
    'budget-analysis': 'Budget',
    'report-analysis': 'Rapport',
    'task-decomposition': 'Taches IA',
  };

  return labels[type] ?? type;
}

function previewPayload(payload: unknown) {
  if (typeof payload === 'object' && payload !== null) {
    if ('content' in payload && typeof payload.content === 'string') {
      return payload.content;
    }

    if ('insights' in payload && Array.isArray(payload.insights)) {
      return payload.insights.join(' ');
    }

    if ('projectName' in payload && typeof payload.projectName === 'string') {
      return payload.projectName;
    }

    if ('tasks' in payload && Array.isArray(payload.tasks)) {
      return `${payload.tasks.length} tache(s) archivee(s)`;
    }
  }

  return 'Generation IA archivee';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function textFrom(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function renderTextBlock(text: string) {
  return (
    <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
      {text.replace(/\*\*/g, '').replace(/\\"/g, '"')}
    </div>
  );
}

function ArchiveDetail({ item }: { item: AiArchiveItem }) {
  const payload = isRecord(item.payload) ? item.payload : {};
  const content = textFrom(payload.content);
  const insights = Array.isArray(payload.insights) ? payload.insights.filter((entry): entry is string => typeof entry === 'string') : [];
  const tasks = Array.isArray(payload.tasks) ? payload.tasks.filter((entry): entry is string => typeof entry === 'string') : [];
  const selectedTasks = Array.isArray(payload.selectedTasks)
    ? payload.selectedTasks.filter((entry): entry is string => typeof entry === 'string')
    : [];
  const risks = Array.isArray(payload.risks) ? payload.risks.filter(isRecord) : [];
  const entities = Array.isArray(payload.entities) ? payload.entities.filter(isRecord) : [];

  if (content) {
    return renderTextBlock(content);
  }

  if (insights.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {insights.map((insight, index) => (
          <div key={index} className="ai-insight">
            <span className="insight-ico">{index + 1}.</span>
            <div className="insight-txt">{insight}</div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length > 0 || selectedTasks.length > 0) {
    const list = selectedTasks.length > 0 ? selectedTasks : tasks;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {list.map((task, index) => (
          <div key={index} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: '13px' }}>
            {task}
          </div>
        ))}
      </div>
    );
  }

  if (risks.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {risks.map((risk, index) => (
          <div key={index} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent3)', marginBottom: '4px' }}>
              {textFrom(risk.level) || 'Risque'} - {textFrom(risk.title)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.6 }}>{textFrom(risk.description)}</div>
          </div>
        ))}
      </div>
    );
  }

  if (entities.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {entities.map((entity, index) => (
          <div key={index} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>{textFrom(entity.label) || textFrom(entity.type)}</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{textFrom(entity.value)}</div>
          </div>
        ))}
      </div>
    );
  }

  return renderTextBlock(previewPayload(item.payload));
}

export default function AiArchives() {
  const [items, setItems] = useState<AiArchiveItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  );

  const refresh = () => {
    const archive = getAiArchive();
    setItems(archive);
    setSelectedId((current) => current ?? archive[0]?.id ?? null);
  };

  const alerts = useAlert();

  const handleDeleteArchive = async (archiveId: string) => {
    const archiveItem = items.find((item) => item.id === archiveId);
    const confirmed = await alerts.confirm({
      title: 'Supprimer cette archive IA ?',
      message: archiveItem ? `${archiveItem.title} sera définitivement supprimée.` : 'Cette action est définitive.',
      confirmText: 'Supprimer',
      tone: 'warning',
    });

    if (!confirmed) {
      return;
    }

    setDeletingId(archiveId);
    try {
      deleteAiArchive(archiveId);
      setItems((current) => {
        const next = current.filter((item) => item.id !== archiveId);
        if (selectedId === archiveId) {
          setSelectedId(next[0]?.id ?? null);
        }
        return next;
      });
      alerts.success('Archive supprimée', archiveItem ? `${archiveItem.title} a été supprimée.` : undefined);
    } catch (deleteError) {
      alerts.error('Suppression impossible', deleteError instanceof Error ? deleteError.message : 'Réessayez dans un instant.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const id = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ margin: 0 }}>Archives IA</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {items.length} generation{items.length > 1 ? 's' : ''} validee{items.length > 1 ? 's' : ''} localement
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={refresh}>Actualiser</button>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: '70px 40px' }}>
            <div className="empty-ico">AI</div>
            <p style={{ color: 'var(--accent)', fontSize: '16px', marginBottom: '8px' }}>Aucune archive IA</p>
            <p>Validez une generation IA pour la retrouver ici.</p>
          </div>
        </div>
      ) : (
        <div className="grid-lr">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Liste des archives</div>
              <span className="badge b-gray">{items.length}</span>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item) => {
                const active = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      background: active ? 'rgba(79,255,176,0.08)' : 'var(--surface2)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                      <span className="ai-badge" style={{ fontSize: '10px' }}>{typeLabel(item.type)}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)' }}>
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {previewPayload(item.payload)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Detail</div>
              {selected ? <span className="badge b-green">Archivee</span> : null}
            </div>
            {selected ? (
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteArchive(selected.id)}
                    disabled={deletingId === selected.id}
                  >
                    {deletingId === selected.id ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span className="ai-badge">{typeLabel(selected.type)}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(selected.createdAt)}</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>{selected.title}</div>
                <ArchiveDetail item={selected} />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
