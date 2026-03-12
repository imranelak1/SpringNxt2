'use client';

export default function Ressources() {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ flex: 1 }}>
                    <div className="section-title" style={{ margin: 0 }}>Gestion des ressources</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>5 membres · Semaine du 3 Mar</div>
                </div>
                <button className="btn btn-ghost btn-sm">Semaine ▾</button>
                <button className="btn btn-primary btn-sm">＋ Ajouter membre</button>
            </div>

            <div className="stats-row">
                <div className="stat-card sc1"><div className="stat-lbl">Membres actifs</div><div className="stat-val">5</div><div className="stat-chg">Équipe complète</div></div>
                <div className="stat-card sc4"><div className="stat-lbl">En surcharge</div><div className="stat-val">1</div><div className="stat-chg down">⚠ Karima ≥ 130%</div></div>
                <div className="stat-card sc2"><div className="stat-lbl">Taux moyen</div><div className="stat-val">75%</div><div className="stat-chg">Optimal : 70–85%</div></div>
                <div className="stat-card sc3"><div className="stat-lbl">Heures planifiées</div><div className="stat-val">148h</div><div className="stat-chg up">↑ +12h vs sem. passée</div></div>
            </div>

            <div className="card mb18">
                <div className="card-header"><div className="card-title">Charge par membre — semaine en cours</div></div>
                <table className="tbl">
                    <thead><tr><th>Membre</th><th>Rôle</th><th>Projets assignés</th><th>Heures / Semaine</th><th>Charge</th><th>Disponibilité</th></tr></thead>
                    <tbody>
                        <tr>
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><div className="av" style={{ background: 'linear-gradient(135deg,#f093fb,#f5576c)' }}>KT</div><div><div style={{ fontSize: '13px', fontWeight: 500 }}>Karima Tahiri</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>karima@nexus.ma</div></div></div></td>
                            <td><span style={{ fontSize: '12.5px' }}>🎨 UX/UI Design</span></td>
                            <td><span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Refonte Web · Design System · Campagne Q2</span></td>
                            <td><span style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontSize: '14px', color: 'var(--accent3)' }}>55h / 40h</span></td>
                            <td><div className="pbar-wrap"><div className="pbar"><div className="pfill" style={{ width: '100%', background: 'var(--accent3)' }}></div></div><span className="ppct" style={{ color: 'var(--accent3)' }}>138%</span></div></td>
                            <td><span className="badge b-red">Surchargée</span></td>
                        </tr>
                        <tr>
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><div className="av" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>SA</div><div><div style={{ fontSize: '13px', fontWeight: 500 }}>Sofia Amrani</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>sofia@nexus.ma</div></div></div></td>
                            <td><span style={{ fontSize: '12.5px' }}>📋 Chef de Projet</span></td>
                            <td><span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Refonte Web · App Mobile · Rapport Q1</span></td>
                            <td><span style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontSize: '14px', color: 'var(--accent4)' }}>34h / 40h</span></td>
                            <td><div className="pbar-wrap"><div className="pbar"><div className="pfill" style={{ width: '85%', background: 'var(--accent4)' }}></div></div><span className="ppct">85%</span></div></td>
                            <td><span className="badge b-yellow">Occupée</span></td>
                        </tr>
                        <tr>
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><div className="av" style={{ background: 'linear-gradient(135deg,#43e97b,#38f9d7)' }}>HB</div><div><div style={{ fontSize: '13px', fontWeight: 500 }}>Hassan Benjelloun</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>hassan@nexus.ma</div></div></div></td>
                            <td><span style={{ fontSize: '12.5px' }}>💻 Dev Frontend</span></td>
                            <td><span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>App Mobile · API Stripe</span></td>
                            <td><span style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontSize: '14px', color: 'var(--accent)' }}>24h / 40h</span></td>
                            <td><div className="pbar-wrap"><div className="pbar"><div className="pfill" style={{ width: '60%' }}></div></div><span className="ppct">60%</span></div></td>
                            <td><span className="badge b-green">Disponible</span></td>
                        </tr>
                        <tr>
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><div className="av" style={{ background: 'linear-gradient(135deg,#fa709a,#fee140)' }}>YE</div><div><div style={{ fontSize: '13px', fontWeight: 500 }}>Youssef El Amrani</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>youssef@nexus.ma</div></div></div></td>
                            <td><span style={{ fontSize: '12.5px' }}>⚙ Dev Backend</span></td>
                            <td><span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>App Mobile · CI/CD</span></td>
                            <td><span style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontSize: '14px', color: 'var(--accent)' }}>18h / 40h</span></td>
                            <td><div className="pbar-wrap"><div className="pbar"><div className="pfill" style={{ width: '45%' }}></div></div><span className="ppct">45%</span></div></td>
                            <td><span className="badge b-green">Disponible</span></td>
                        </tr>
                        <tr>
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><div className="av" style={{ background: 'linear-gradient(135deg,#fccb90,#d57eeb)' }}>NA</div><div><div style={{ fontSize: '13px', fontWeight: 500 }}>Nadia Alami</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>nadia@nexus.ma</div></div></div></td>
                            <td><span style={{ fontSize: '12.5px' }}>📣 Marketing</span></td>
                            <td><span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Campagne Q2 · Réseaux sociaux</span></td>
                            <td><span style={{ fontFamily: 'var(--font-syne,Syne),sans-serif', fontSize: '14px', color: 'var(--accent4)' }}>30h / 40h</span></td>
                            <td><div className="pbar-wrap"><div className="pbar"><div className="pfill" style={{ width: '75%', background: 'var(--accent4)' }}></div></div><span className="ppct">75%</span></div></td>
                            <td><span className="badge b-green">Disponible</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="ai-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><span className="ai-badge">✦ IA</span><span className="ai-title">Recommandations d'allocation</span></div>
                <div className="ai-insight"><span className="insight-ico">⚡</span><div className="insight-txt"><strong>Action urgente :</strong> Déplacer &ldquo;Géolocalisation temps réel&rdquo; de Karima vers Youssef El Amrani. Économie de 12h sur la semaine de Karima.</div></div>
                <div className="ai-insight"><span className="insight-ico">💡</span><div className="insight-txt"><strong>Opportunité :</strong> Hassan Benjelloun a 16h disponibles. Peut absorber 2 tâches frontend du backlog Design System.</div></div>
                <div className="ai-insight"><span className="insight-ico">📅</span><div className="insight-txt"><strong>Prévision :</strong> Si aucune réallocation, risque de burnout pour Karima d'ici 2 semaines. Taux cible recommandé : ≤ 90%.</div></div>
            </div>
        </div>
    );
}
