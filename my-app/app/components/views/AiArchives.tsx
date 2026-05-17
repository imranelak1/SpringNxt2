'use client';

import { useEffect, useMemo, useState } from 'react';
import { Archive, Clock, RefreshCw, Search, Trash2 } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const archiveTypes = useMemo(
    () => Array.from(new Set(items.map((item) => item.type))).sort(),
    [items],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
      const matchesSearch =
        !normalizedSearch ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        typeLabel(item.type).toLowerCase().includes(normalizedSearch) ||
        previewPayload(item.payload).toLowerCase().includes(normalizedSearch);

      return matchesType && matchesSearch;
    });
  }, [items, search, typeFilter]);

  const selected = useMemo(
    () => filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0] ?? null,
    [filteredItems, selectedId],
  );

  const latest = items[0] ?? null;

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(61,138,255,0.12)',
            color: 'var(--accent2)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Archive size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="section-title" style={{ margin: 0 }}>Archives IA</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Bibliothèque des générations IA validées : analyses, simulations, risques, imports PDF et tâches.
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={refresh}>
          <RefreshCw size={14} />
          Actualiser
        </button>
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
        <div style={{ display: 'grid', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
            <div className="stat-card sc1">
              <div className="stat-lbl">Archives validées</div>
              <div className="stat-val">{items.length}</div>
              <div className="stat-chg up">Conservées dans le navigateur</div>
            </div>
            <div className="stat-card sc2">
              <div className="stat-lbl">Catégories</div>
              <div className="stat-val">{archiveTypes.length}</div>
              <div className="stat-chg">Sources IA différentes</div>
            </div>
            <div className="stat-card sc3">
              <div className="stat-lbl">Dernière archive</div>
              <div className="stat-val" style={{ fontSize: '20px' }}>{latest ? typeLabel(latest.type) : '-'}</div>
              <div className="stat-chg">{latest ? formatDate(latest.createdAt) : 'Aucune donnée'}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 220px', gap: '10px', padding: '12px' }}>
              <label style={{ position: 'relative', minWidth: 0 }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher une archive, un projet, une analyse..."
                  style={{ width: '100%', height: '36px', paddingLeft: '34px' }}
                />
              </label>
              <select className="form-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} style={{ height: '36px' }}>
                <option value="ALL">Toutes les catégories</option>
                {archiveTypes.map((type) => (
                  <option key={type} value={type}>{typeLabel(type)}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 390px) minmax(0, 1fr)', gap: '14px', alignItems: 'start' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Historique IA</div>
                <span className="badge b-gray">{filteredItems.length}/{items.length}</span>
              </div>
              <div style={{ padding: '12px', display: 'grid', gap: '8px', maxHeight: '660px', overflow: 'auto' }}>
                {filteredItems.length === 0 ? (
                  <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px' }}>
                    Aucun résultat pour ce filtre.
                  </div>
                ) : (
                  filteredItems.map((item) => {
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                          <span className="ai-badge" style={{ fontSize: '10px' }}>{typeLabel(item.type)}</span>
                          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                            <Clock size={11} />
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {previewPayload(item.payload)}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="card" style={{ minHeight: '420px' }}>
              <div className="card-header">
                <div className="card-title">Détail de l'archive</div>
                {selected ? <span className="badge b-green">Archivée</span> : null}
              </div>
              {selected ? (
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '9px', flexWrap: 'wrap' }}>
                        <span className="ai-badge">{typeLabel(selected.type)}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(selected.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1.25 }}>{selected.title}</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteArchive(selected.id)}
                      disabled={deletingId === selected.id}
                      title="Supprimer cette archive"
                    >
                      <Trash2 size={13} />
                      {deletingId === selected.id ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                  <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <ArchiveDetail item={selected} />
                  </div>
                </div>
              ) : (
                <div className="card-body" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Sélectionne une archive pour afficher son contenu.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
