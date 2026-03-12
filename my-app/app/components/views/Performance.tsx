'use client';

export default function Performance() {
    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <div className="section-title">Performance globale</div>
                <div className="section-sub">Indicateurs clés · Comparaison Mars vs Février 2025</div>
            </div>

            <div className="stats-row">
                <div className="stat-card sc1"><div className="stat-lbl">Vélocité équipe</div><div className="stat-val">87</div><div className="stat-chg up">↑ +9 pts vs Fév</div></div>
                <div className="stat-card sc2"><div className="stat-lbl">Taux livraison</div><div className="stat-val">80%</div><div className="stat-chg up">↑ +5% vs Fév</div></div>
                <div className="stat-card sc3"><div className="stat-lbl">Satisfaction client</div><div className="stat-val">4.6</div><div className="stat-chg up">↑ +0.3 vs Fév</div></div>
                <div className="stat-card sc4"><div className="stat-lbl">Bugs critiques</div><div className="stat-val">7</div><div className="stat-chg down">↓ −3 vs Fév</div></div>
            </div>

            <div className="grid-2 mb18">
                <div className="card">
                    <div className="card-header"><div className="card-title">Tâches complétées par semaine</div></div>
                    <div style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
                            {[
                                { label: 'S1', h: '55px', bg: 'var(--surface2)' },
                                { label: 'S2', h: '70px', bg: 'var(--surface2)' },
                                { label: 'S3', h: '60px', bg: 'rgba(61,138,255,0.25)' },
                                { label: 'S4', h: '90px', bg: 'rgba(79,255,176,0.25)' },
                                { label: 'S5', h: '48px', bg: 'var(--surface2)' },
                                { label: 'S6', h: '65px', bg: 'var(--surface2)' },
                                { label: 'S7', h: '100px', bg: 'linear-gradient(180deg,var(--accent),var(--accent2))' },
                            ].map(({ label, h, bg }) => (
                                <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '100%', background: bg, height: h, borderRadius: '4px 4px 0 0' }}></div>
                                    <div style={{ fontSize: '10px', color: label === 'S7' ? 'var(--accent)' : 'var(--text-muted)' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Moy : <strong style={{ color: 'var(--text)' }}>18 tâches/sem</strong></span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Max : <strong style={{ color: 'var(--accent)' }}>27 tâches</strong></span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tendance : <strong style={{ color: 'var(--accent)' }}>↑ Hausse</strong></span>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><div className="card-title">Performance par membre</div></div>
                    <table className="tbl">
                        <thead><tr><th>Membre</th><th>Tâches</th><th>À temps</th><th>Score</th></tr></thead>
                        <tbody>
                            <tr>
                                <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="av" style={{ width: '26px', height: '26px', fontSize: '10px', background: 'linear-gradient(135deg,#43e97b,#38f9d7)' }}>HB</div><span style={{ fontSize: '13px' }}>Hassan B.</span></div></td>
                                <td style={{ fontSize: '13px', color: 'var(--text-dim)' }}>24</td>
                                <td><span className="badge b-green">96%</span></td>
                                <td style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>A+</td>
                            </tr>
                            <tr>
                                <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="av" style={{ width: '26px', height: '26px', fontSize: '10px', background: 'linear-gradient(135deg,#fa709a,#fee140)' }}>YE</div><span style={{ fontSize: '13px' }}>Youssef E.</span></div></td>
                                <td style={{ fontSize: '13px', color: 'var(--text-dim)' }}>18</td>
                                <td><span className="badge b-green">94%</span></td>
                                <td style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>A</td>
                            </tr>
                            <tr>
                                <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="av" style={{ width: '26px', height: '26px', fontSize: '10px', background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>SA</div><span style={{ fontSize: '13px' }}>Sofia A.</span></div></td>
                                <td style={{ fontSize: '13px', color: 'var(--text-dim)' }}>31</td>
                                <td><span className="badge b-yellow">82%</span></td>
                                <td style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--accent4)' }}>B+</td>
                            </tr>
                            <tr>
                                <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="av" style={{ width: '26px', height: '26px', fontSize: '10px', background: 'linear-gradient(135deg,#f093fb,#f5576c)' }}>KT</div><span style={{ fontSize: '13px' }}>Karima T.</span></div></td>
                                <td style={{ fontSize: '13px', color: 'var(--text-dim)' }}>38</td>
                                <td><span className="badge b-red">71%</span></td>
                                <td style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--accent3)' }}>C</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="ai-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><span className="ai-badge">✦ IA</span><span className="ai-title">Analyse de performance — Points d'amélioration</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                    <div className="ai-insight"><span className="insight-ico">🔺</span><div className="insight-txt"><strong>Hassan &amp; Youssef</strong> — performance excellente. Augmenter leur responsabilité sur les prochains sprints.</div></div>
                    <div className="ai-insight"><span className="insight-ico">⚠</span><div className="insight-txt"><strong>Karima</strong> — score en baisse à cause de la surcharge (138%). Solution = réallocation de tâches.</div></div>
                    <div className="ai-insight"><span className="insight-ico">🎯</span><div className="insight-txt">Objectif Q2 : Amener le taux de livraison à <strong>90%+</strong>. Focus sur Sprint planning et scope freeze.</div></div>
                </div>
            </div>
        </div>
    );
}
