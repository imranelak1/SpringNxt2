'use client';

export default function Rapports() {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                    <div className="section-title" style={{ margin: 0 }}>Rapports &amp; Analyses IA</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Générés automatiquement · Mis à jour le 3 Mars 2025</div>
                </div>
                <button className="btn btn-ghost btn-sm">📥 Exporter PDF</button>
                <button className="btn btn-primary btn-sm">✦ Générer rapport</button>
            </div>

            <div className="grid-lr">
                <div className="col-stack">
                    <div className="card">
                        <div className="card-header"><div className="card-title">Synthèse mensuelle — Février 2025</div><span className="badge b-green">Généré par IA</span></div>
                        <div className="card-body">
                            <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '16px' }}>
                                Février a été un mois solide pour l'agence avec <strong style={{ color: 'var(--text)' }}>5 projets actifs</strong> et un taux de livraison dans les délais de <strong style={{ color: 'var(--accent)' }}>80%</strong>. Le chiffre d'affaires réalisé s'élève à <strong style={{ color: 'var(--accent4)' }}>121 000 MAD</strong>, soit une hausse de <strong style={{ color: 'var(--accent)' }}>+14%</strong> par rapport à janvier. La satisfaction client moyenne est de <strong style={{ color: 'var(--accent)' }}>4.6/5</strong>.
                            </div>
                            <div className="divider"></div>
                            <div className="gauge-row">
                                <div className="gauge-item"><div className="gauge-val" style={{ color: 'var(--accent)' }}>80%</div><div className="gauge-lbl">Tâches livrées dans les délais</div></div>
                                <div className="gauge-item"><div className="gauge-val" style={{ color: 'var(--accent2)' }}>4.6</div><div className="gauge-lbl">Satisfaction client /5</div></div>
                                <div className="gauge-item"><div className="gauge-val" style={{ color: 'var(--accent4)' }}>+14%</div><div className="gauge-lbl">Croissance CA</div></div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header"><div className="card-title">Évolution des projets livrés</div><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>6 derniers mois</span></div>
                        <div style={{ padding: '16px 20px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '90px', marginBottom: '8px' }}>
                                {[
                                    { label: 'Oct', h: '45px', bg: 'var(--surface2)' },
                                    { label: 'Nov', h: '60px', bg: 'var(--surface2)' },
                                    { label: 'Déc', h: '40px', bg: 'var(--surface2)' },
                                    { label: 'Jan', h: '75px', bg: 'rgba(61,138,255,0.3)' },
                                    { label: 'Fév', h: '65px', bg: 'rgba(61,138,255,0.4)' },
                                    { label: 'Mar', h: '90px', bg: 'linear-gradient(180deg,var(--accent),var(--accent2))' },
                                ].map(({ label, h, bg }) => (
                                    <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '100%', background: bg, height: h, borderRadius: '5px 5px 0 0' }}></div>
                                        <span style={{ fontSize: '10px', color: label === 'Mar' ? 'var(--accent)' : 'var(--text-muted)' }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header"><div className="card-title">Prévisions Q2 2025</div><span className="badge b-purple">Prédictif IA</span></div>
                        <div className="card-body">
                            <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.7 }}>
                                Sur la base des tendances actuelles, l'IA prédit un CA de <strong style={{ color: 'var(--accent4)' }}>420 000 MAD</strong> sur le Q2, avec un pic en mai (+22%). 3 nouveaux projets sont attendus selon le pipeline. Risque principal : saturation des ressources design si Campagne Q2 et Design System reprennent simultanément.
                            </div>
                            <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <span className="badge b-green">↑ CA +22% prévu en Mai</span>
                                <span className="badge b-yellow">⚠ Risque ressources Design</span>
                                <span className="badge b-blue">3 projets en pipeline</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-stack">
                    <div className="ai-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}><span className="ai-badge">✦ IA</span><span className="ai-title">Analyse intelligente</span></div>
                        <div className="ai-insight"><span className="insight-ico">📈</span><div className="insight-txt"><strong>Point fort :</strong> Taux de satisfaction client de 4.6/5, meilleur score en 12 mois. Le projet Dashboard Atlas a obtenu 5/5.</div></div>
                        <div className="ai-insight"><span className="insight-ico">⚠</span><div className="insight-txt"><strong>Point d'attention :</strong> 3 délais manqués en février — tous liés au projet App Mobile. Cause identifiée : scope creep non documenté.</div></div>
                        <div className="ai-insight"><span className="insight-ico">💡</span><div className="insight-txt"><strong>Recommandation :</strong> Instaurer une réunion hebdomadaire de scope review pour les projets en phase finale. Réduction estimée des retards : 70%.</div></div>
                        <div className="ai-insight"><span className="insight-ico">🎯</span><div className="insight-txt"><strong>Objectif Mars :</strong> Clôturer App Mobile à temps. Livrer Refonte Web à 90%+. Démarrer sprint 1 de Campagne Q2.</div></div>
                    </div>

                    <div className="card">
                        <div className="card-header"><div className="card-title">Répartition par client</div></div>
                        <div style={{ padding: '16px 20px' }}>
                            <div className="bud-row"><div className="bud-label">TechCorp Maroc</div><div className="bud-bar"><div className="bud-fill" style={{ width: '72%', background: 'var(--accent)' }}></div></div><div className="bud-val" style={{ color: 'var(--accent)' }}>72 000 MAD</div></div>
                            <div className="bud-row"><div className="bud-label">StartupX</div><div className="bud-bar"><div className="bud-fill" style={{ width: '50%', background: 'var(--accent2)' }}></div></div><div className="bud-val" style={{ color: 'var(--accent2)' }}>50 000 MAD</div></div>
                            <div className="bud-row"><div className="bud-label">BrandMax</div><div className="bud-bar"><div className="bud-fill" style={{ width: '20%', background: 'var(--accent4)' }}></div></div><div className="bud-val" style={{ color: 'var(--accent4)' }}>20 500 MAD</div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
