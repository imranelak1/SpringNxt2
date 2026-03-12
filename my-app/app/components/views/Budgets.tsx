'use client';

export default function Budgets() {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                    <div className="section-title" style={{ margin: 0 }}>Suivi des budgets</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Mars 2025 · Budget total alloué : 520 000 MAD</div>
                </div>
                <button className="btn btn-ghost btn-sm">📥 Exporter Excel</button>
                <button className="btn btn-primary btn-sm">＋ Ajouter dépense</button>
            </div>

            <div className="stats-row">
                <div className="stat-card sc1"><div className="stat-lbl">Budget total</div><div className="stat-val">520k</div><div className="stat-chg">MAD alloués</div></div>
                <div className="stat-card sc3"><div className="stat-lbl">Consommé</div><div className="stat-val">354k</div><div className="stat-chg down">68% du total</div></div>
                <div className="stat-card sc2"><div className="stat-lbl">Restant</div><div className="stat-val">166k</div><div className="stat-chg up">32% disponible</div></div>
                <div className="stat-card sc4"><div className="stat-lbl">Dépassements</div><div className="stat-val">2</div><div className="stat-chg down">⚠ App Mobile, Campagne</div></div>
            </div>

            <div className="grid-lr">
                <div className="card">
                    <div className="card-header"><div className="card-title">Budget par projet</div></div>
                    <table className="tbl">
                        <thead><tr><th>Projet</th><th>Alloué</th><th>Consommé</th><th>Restant</th><th>État</th></tr></thead>
                        <tbody>
                            <tr>
                                <td style={{ fontSize: '13px', fontWeight: 500 }}>🌐 Refonte Site Web</td>
                                <td style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>120 000 MAD</td>
                                <td><div className="pbar-wrap"><div className="pbar"><div className="pfill" style={{ width: '68%' }}></div></div><span style={{ fontSize: '12px', minWidth: '65px' }}>81 600 MAD</span></div></td>
                                <td style={{ fontSize: '12.5px', color: 'var(--accent)' }}>38 400 MAD</td>
                                <td><span className="badge b-green">✓ Normal</span></td>
                            </tr>
                            <tr>
                                <td style={{ fontSize: '13px', fontWeight: 500 }}>📱 Application Mobile</td>
                                <td style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>180 000 MAD</td>
                                <td><div className="pbar-wrap"><div className="pbar"><div className="pfill" style={{ width: '100%', background: 'var(--accent3)' }}></div></div><span style={{ fontSize: '12px', minWidth: '65px', color: 'var(--accent3)' }}>194 000 MAD</span></div></td>
                                <td style={{ fontSize: '12.5px', color: 'var(--accent3)' }}>−14 000 MAD</td>
                                <td><span className="badge b-red">⚠ Dépassé</span></td>
                            </tr>
                            <tr>
                                <td style={{ fontSize: '13px', fontWeight: 500 }}>📣 Campagne Q2</td>
                                <td style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>95 000 MAD</td>
                                <td><div className="pbar-wrap"><div className="pbar"><div className="pfill" style={{ width: '35%', background: 'var(--accent4)' }}></div></div><span style={{ fontSize: '12px', minWidth: '65px' }}>33 250 MAD</span></div></td>
                                <td style={{ fontSize: '12.5px', color: 'var(--accent)' }}>61 750 MAD</td>
                                <td><span className="badge b-yellow">Surveiller</span></td>
                            </tr>
                            <tr>
                                <td style={{ fontSize: '13px', fontWeight: 500 }}>🎨 Design System</td>
                                <td style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>45 000 MAD</td>
                                <td><div className="pbar-wrap"><div className="pbar"><div className="pfill" style={{ width: '55%', background: 'var(--accent5)' }}></div></div><span style={{ fontSize: '12px', minWidth: '65px' }}>24 750 MAD</span></div></td>
                                <td style={{ fontSize: '12.5px', color: 'var(--accent)' }}>20 250 MAD</td>
                                <td><span className="badge b-gray">En pause</span></td>
                            </tr>
                            <tr>
                                <td style={{ fontSize: '13px', fontWeight: 500 }}>📊 Dashboard Analytics</td>
                                <td style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>80 000 MAD</td>
                                <td><div className="pbar-wrap"><div className="pbar"><div className="pfill" style={{ width: '100%', background: 'var(--accent2)' }}></div></div><span style={{ fontSize: '12px', minWidth: '65px', color: 'var(--accent2)' }}>80 000 MAD</span></div></td>
                                <td style={{ fontSize: '12.5px', color: 'var(--accent2)' }}>0 MAD</td>
                                <td><span className="badge b-blue">Livré ✓</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="col-stack">
                    <div className="card">
                        <div className="card-header"><div className="card-title">Dépenses par catégorie</div></div>
                        <div style={{ padding: '16px 20px' }}>
                            <div className="bud-row"><div className="bud-label">💻 Développement</div><div className="bud-bar"><div className="bud-fill" style={{ width: '72%', background: 'var(--accent2)' }}></div></div><div className="bud-val" style={{ color: 'var(--accent2)' }}>162 000</div></div>
                            <div className="bud-row"><div className="bud-label">🎨 Design</div><div className="bud-bar"><div className="bud-fill" style={{ width: '40%', background: 'var(--accent5)' }}></div></div><div className="bud-val" style={{ color: 'var(--accent5)' }}>88 000</div></div>
                            <div className="bud-row"><div className="bud-label">📣 Marketing</div><div className="bud-bar"><div className="bud-fill" style={{ width: '28%', background: 'var(--accent3)' }}></div></div><div className="bud-val" style={{ color: 'var(--accent3)' }}>62 000</div></div>
                            <div className="bud-row"><div className="bud-label">⚙ Infra / SaaS</div><div className="bud-bar"><div className="bud-fill" style={{ width: '20%', background: 'var(--accent4)' }}></div></div><div className="bud-val" style={{ color: 'var(--accent4)' }}>42 000</div></div>
                        </div>
                    </div>
                    <div className="ai-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><span className="ai-badge">✦ IA</span><span className="ai-title">Alertes budgétaires</span></div>
                        <div className="ai-insight"><span className="insight-ico">🔴</span><div className="insight-txt"><strong>App Mobile :</strong> Budget dépassé de 14k MAD. Négocier avenants client ou absorber sur Q2.</div></div>
                        <div className="ai-insight"><span className="insight-ico">🟡</span><div className="insight-txt"><strong>Campagne Q2 :</strong> Projection actuelle indique +8% dépassement potentiel. Revoyez dépenses médias.</div></div>
                        <div className="ai-insight"><span className="insight-ico">✅</span><div className="insight-txt"><strong>Refonte Web :</strong> Budget bien maîtrisé. Marge suffisante pour absorber 2–3 révisions supplémentaires.</div></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
