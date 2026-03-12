'use client';
import { useState } from 'react';

type Step = 'upload' | 'validate' | 'done';

interface ExtractedEntity {
    type: 'project' | 'task' | 'date' | 'member';
    label: string;
    value: string;
    sub?: string;
    editable?: boolean;
}

const mockExtracted: ExtractedEntity[] = [
    { type: 'project', label: 'Nom du projet', value: 'Refonte Portail RH', sub: 'Extrait du titre du document', editable: true },
    { type: 'date', label: 'Date de début', value: '01 Avril 2025', sub: 'Trouvé dans section "Calendrier"', editable: true },
    { type: 'date', label: 'Date de fin', value: '30 Juin 2025', sub: 'Trouvé dans section "Livrables"', editable: true },
    { type: 'member', label: 'Chef de projet', value: 'Sofia Amrani', sub: 'Mentionné dans "Responsabilités"', editable: true },
    { type: 'task', label: 'Tâche identifiée', value: 'Audit des processus RH existants', sub: 'Phase 1 · Priorité haute' },
    { type: 'task', label: 'Tâche identifiée', value: 'Conception des maquettes UX/UI', sub: 'Phase 2 · Design' },
    { type: 'task', label: 'Tâche identifiée', value: 'Développement backend Spring Boot', sub: 'Phase 3 · Développement' },
    { type: 'task', label: 'Tâche identifiée', value: 'Tests UAT et recette client', sub: 'Phase 4 · QA' },
    { type: 'member', label: 'Équipe identifiée', value: '5 développeurs + 1 designer', sub: 'Estimé depuis la charge de travail' },
];

const typeClass: Record<string, string> = {
    project: 'et-project', task: 'et-task', date: 'et-date', member: 'et-member'
};
const typeLabel: Record<string, string> = {
    project: 'Projet', task: 'Tâche', date: 'Date', member: 'Membre'
};

export default function PdfImport() {
    const [step, setStep] = useState<Step>('upload');
    const [dragging, setDragging] = useState(false);
    const [fileName, setFileName] = useState('');
    const [parsing, setParsing] = useState(false);
    const [entities, setEntities] = useState<ExtractedEntity[]>(mockExtracted);
    const [editIdx, setEditIdx] = useState<number | null>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') simulateParse(file.name);
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) simulateParse(file.name);
    };

    const simulateParse = (name: string) => {
        setFileName(name);
        setParsing(true);
        setTimeout(() => { setParsing(false); setStep('validate'); }, 2200);
    };

    const handleConfirm = () => setStep('done');

    if (step === 'done') return (
        <div>
            <div className="section-title">Import PDF — Projet créé ✓</div>
            <div className="card">
                <div className="empty-state" style={{ padding: '70px 40px' }}>
                    <div className="empty-ico">🎉</div>
                    <p style={{ color: 'var(--accent)', fontSize: '16px', marginBottom: '8px' }}>Projet créé avec succès !</p>
                    <p style={{ marginBottom: '20px' }}>Refonte Portail RH · 8 tâches générées · Équipe assignée</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button className="btn btn-primary">Voir le projet →</button>
                        <button className="btn btn-ghost" onClick={() => setStep('upload')}>Importer un autre PDF</button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
                <div style={{ flex: 1 }}>
                    <div className="section-title" style={{ margin: 0 }}>Import PDF → Projet</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Importez un cahier des charges pour générer automatiquement un projet
                    </div>
                </div>
                {/* Steps indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: step !== 'upload' ? 'var(--accent)' : 'var(--text)' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, background: step !== 'upload' ? 'var(--accent)' : 'var(--surface2)', color: step !== 'upload' ? '#0a0c10' : 'var(--text)', border: '1px solid var(--border)' }}>1</div>
                        Upload
                    </div>
                    <div style={{ width: '24px', height: '1px', background: 'var(--border)' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: step === 'validate' || step === 'done' ? 'var(--accent)' : 'var(--text-muted)' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, background: step === 'validate' ? 'var(--accent)' : 'var(--surface2)', color: step === 'validate' ? '#0a0c10' : 'inherit', border: '1px solid var(--border)' }}>2</div>
                        Validation
                    </div>
                    <div style={{ width: '24px', height: '1px', background: 'var(--border)' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, background: 'var(--surface2)', border: '1px solid var(--border)' }}>3</div>
                        Création
                    </div>
                </div>
            </div>

            {step === 'upload' && (
                <div>
                    {parsing ? (
                        <div className="card">
                            <div className="empty-state" style={{ padding: '80px 40px' }}>
                                <div style={{ fontSize: '36px', marginBottom: '18px', animation: 'fadeUp 0.5s infinite alternate' }}>📄</div>
                                <div className="section-title" style={{ marginBottom: '8px' }}>Analyse en cours...</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>{fileName}</div>
                                <div style={{ width: '200px', height: '4px', background: 'var(--surface2)', borderRadius: '10px', overflow: 'hidden', margin: '0 auto' }}>
                                    <div style={{ height: '100%', background: 'var(--accent)', borderRadius: '10px', width: '60%', animation: 'pulseWidth 1.5s ease-in-out infinite' }}></div>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>Extraction des entités... Identification des tâches...</div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label>
                                <div
                                    className={`pdf-upload-zone ${dragging ? 'drag-over' : ''}`}
                                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                                    onDragLeave={() => setDragging(false)}
                                    onDrop={handleDrop}
                                >
                                    <div className="pdf-upload-icon">📄</div>
                                    <div className="pdf-upload-title">Déposez votre cahier des charges ici</div>
                                    <div className="pdf-upload-sub" style={{ marginBottom: '18px' }}>ou cliquez pour sélectionner un fichier PDF</div>
                                    <span className="btn btn-ghost btn-sm">Parcourir les fichiers</span>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>Formats acceptés : PDF · Taille max : 20 MB</div>
                                </div>
                                <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFile} />
                            </label>

                            <div className="ai-card" style={{ marginTop: '18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><span className="ai-badge">✦ IA</span><span className="ai-title">Ce que l'IA va extraire automatiquement</span></div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                    <div className="ai-insight"><span className="insight-ico">📁</span><div className="insight-txt">Nom du projet, client, domaine</div></div>
                                    <div className="ai-insight"><span className="insight-ico">📅</span><div className="insight-txt">Dates, jalons, délais</div></div>
                                    <div className="ai-insight"><span className="insight-ico">✅</span><div className="insight-txt">Tâches et livrables à créer</div></div>
                                    <div className="ai-insight"><span className="insight-ico">👥</span><div className="insight-txt">Rôles et membres mentionnés</div></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 'validate' && (
                <div className="grid-lr">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontWeight: 600, fontSize: '14px' }}>Entités extraites de : {fileName}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{entities.length} éléments identifiés · Vérifiez et modifiez si nécessaire</div>
                            </div>
                            <span className="badge b-green">✦ IA analysé</span>
                        </div>
                        {entities.map((e, i) => (
                            <div key={i} className="extracted-entity">
                                <span className={`entity-type ${typeClass[e.type]}`}>{typeLabel[e.type]}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>{e.label}</div>
                                    {editIdx === i && e.editable ? (
                                        <input className="form-input" style={{ fontSize: '13px', padding: '5px 10px' }} defaultValue={e.value}
                                            onBlur={ev => { setEntities(ents => ents.map((en, idx) => idx === i ? { ...en, value: ev.target.value } : en)); setEditIdx(null); }}
                                            autoFocus />
                                    ) : (
                                        <div className="entity-value" onClick={() => e.editable && setEditIdx(i)} style={{ cursor: e.editable ? 'pointer' : 'default' }}>
                                            {e.value} {e.editable && <span style={{ fontSize: '10px', color: 'var(--accent2)', marginLeft: '6px' }}>✏</span>}
                                        </div>
                                    )}
                                    {e.sub && <div className="entity-sub">{e.sub}</div>}
                                </div>
                                <button className="action-btn action-btn-danger" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => setEntities(ents => ents.filter((_, idx) => idx !== i))}>✕</button>
                            </div>
                        ))}
                    </div>

                    <div className="col-stack">
                        <div className="card">
                            <div className="card-header"><div className="card-title">Résumé du projet</div></div>
                            <div style={{ padding: '16px 18px' }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>Nom détecté</div>
                                    <div style={{ fontSize: '15px', fontWeight: 600 }}>Refonte Portail RH</div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>Durée estimée</div>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--accent4)' }}>3 mois (Avr → Juin 2025)</div>
                                </div>
                                <div style={{ marginBottom: '14px' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>Tâches générées</div>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--accent2)' }}>8 tâches · 4 phases</div>
                                </div>
                                <div className="pbar" style={{ height: '6px', marginBottom: '6px' }}>
                                    <div className="pfill" style={{ width: '0%' }}></div>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prêt à démarrer</div>
                            </div>
                        </div>
                        <div className="ai-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><span className="ai-badge">✦ IA</span><span className="ai-title">Confiance de l'extraction</span></div>
                            <div className="ai-insight"><span className="insight-ico">✅</span><div className="insight-txt">Nom du projet : <strong>94% confiance</strong></div></div>
                            <div className="ai-insight"><span className="insight-ico">✅</span><div className="insight-txt">Dates clés : <strong>91% confiance</strong></div></div>
                            <div className="ai-insight"><span className="insight-ico">⚠</span><div className="insight-txt">Budget : <strong>Non trouvé</strong> — à saisir manuellement</div></div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-ghost" onClick={() => setStep('upload')}>← Retour</button>
                            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleConfirm}>Créer le projet ✓</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
