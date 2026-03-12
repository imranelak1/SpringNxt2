'use client';
import { useState } from 'react';

export default function GanttView() {
    const totalWeeks = 16; // ~4 months
    const projects = [
        { name: 'Refonte Site Web', start: 0, duration: 8, progress: 72, color: 'linear-gradient(90deg,#4fffb0,#3d8aff)', status: 'En cours' },
        { name: 'Application Mobile', start: 1, duration: 10, progress: 89, color: 'linear-gradient(90deg,#3d8aff,#a78bfa)', status: 'En révision' },
        { name: 'Campagne Q2', start: 4, duration: 7, progress: 34, color: 'linear-gradient(90deg,#ffcb47,#ff6b6b)', status: 'En cours' },
        { name: 'Design System', start: 2, duration: 9, progress: 55, color: 'linear-gradient(90deg,#a78bfa,#f093fb)', status: 'En pause' },
        { name: 'Dashboard Analytics', start: 0, duration: 6, progress: 100, color: 'linear-gradient(90deg,#43e97b,#38f9d7)', status: 'Livré' },
    ];

    const months = ['Jan 2025', 'Fév 2025', 'Mar 2025', 'Avr 2025'];
    const weeksPerMonth = 4;

    const today = 9; // current week index (March = ~week 9)

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ flex: 1 }}>
                    <div className="section-title" style={{ margin: 0 }}>Vue Gantt — Projets 2025</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>5 projets · Janvier → Avril 2025</div>
                </div>
                <button className="btn btn-ghost btn-sm">⬅ Période</button>
                <button className="btn btn-ghost btn-sm">Mois ▾</button>
                <button className="btn btn-primary btn-sm">＋ Projet</button>
            </div>

            <div className="card">
                <div style={{ padding: '0', overflowX: 'auto' }}>
                    {/* Header months */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ minWidth: '190px', borderRight: '1px solid var(--border)', padding: '8px 14px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>PROJET</div>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>
                            {months.map(m => (
                                <div key={m} style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, borderRight: '1px solid var(--border)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m}</div>
                            ))}
                        </div>
                    </div>

                    {/* Week markers header */}
                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ minWidth: '190px', borderRight: '1px solid var(--border)' }}></div>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${totalWeeks}, 1fr)` }}>
                            {Array.from({ length: totalWeeks }, (_, i) => (
                                <div key={i} style={{
                                    padding: '4px 2px', fontSize: '9px', color: i === today ? 'var(--accent)' : 'var(--text-muted)',
                                    textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.03)',
                                    fontWeight: i === today ? 700 : 400, background: i === today ? 'rgba(79,255,176,0.04)' : '',
                                }}>
                                    S{i + 1}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Project rows */}
                    {projects.map((p, pIdx) => (
                        <div key={pIdx} style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)', minHeight: '50px', alignItems: 'center' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                            onMouseLeave={e => (e.currentTarget.style.background = '')}
                        >
                            {/* Label col */}
                            <div style={{ minWidth: '190px', borderRight: '1px solid var(--border)', padding: '10px 14px' }}>
                                <div style={{ fontSize: '12.5px', fontWeight: 500, marginBottom: '3px' }}>{p.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.status} · {p.progress}%</div>
                            </div>
                            {/* Timeline */}
                            <div style={{ flex: 1, position: 'relative', height: '50px' }}>
                                {/* Today line */}
                                <div style={{
                                    position: 'absolute', left: `${(today / totalWeeks) * 100}%`, top: 0, bottom: 0,
                                    width: '2px', background: 'var(--accent)', opacity: 0.4, zIndex: 2,
                                }} />
                                {/* Grid lines */}
                                {Array.from({ length: totalWeeks + 1 }, (_, i) => (
                                    <div key={i} style={{ position: 'absolute', left: `${(i / totalWeeks) * 100}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.03)' }} />
                                ))}
                                {/* Bar */}
                                <div style={{
                                    position: 'absolute',
                                    left: `${(p.start / totalWeeks) * 100}%`,
                                    width: `${(p.duration / totalWeeks) * 100}%`,
                                    top: '50%', transform: 'translateY(-50%)',
                                    height: '28px', borderRadius: '6px',
                                    background: p.color, zIndex: 3, overflow: 'hidden',
                                    display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                }}>
                                    {/* Progress fill */}
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${p.progress}%`, background: 'rgba(0,0,0,0.18)', borderRadius: '6px' }} />
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(0,0,0,0.85)', padding: '0 10px', position: 'relative', zIndex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {p.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Legend */}
                    <div style={{ padding: '12px 16px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <div style={{ width: '16px', height: '3px', background: 'var(--accent)', borderRadius: '2px' }}></div>
                            Aujourd'hui (S{today + 1})
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <div style={{ width: '16px', height: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '70%', background: 'rgba(255,255,255,0.2)' }}></div>
                            </div>
                            Progression
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>Cliquer sur une barre pour voir les détails</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
