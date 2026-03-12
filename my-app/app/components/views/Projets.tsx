'use client';
import { useState } from 'react';

export default function Projets() {
    const [filter, setFilter] = useState('Tous');
    const tags = ['Tous', 'En cours', 'En révision', 'Livré', 'En pause'];

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                    <div className="section-title" style={{ margin: 0 }}>Tous les projets</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>12 projets · 3 clients · 5 membres</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {tags.map(t => (
                        <span key={t} className={`tag ${filter === t ? 'sel' : ''}`} onClick={() => setFilter(t)}>{t}</span>
                    ))}
                </div>
                <button className="btn btn-primary btn-sm">＋ Nouveau projet</button>
            </div>

            <div className="grid-3 mb18">
                {/* Card 1 */}
                <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                    <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: 'rgba(79,255,176,0.1)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🌐</div>
                            <div><div style={{ fontSize: '14px', fontWeight: 600 }}>Refonte Site Web</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TechCorp Maroc</div></div>
                            <span className="badge b-green" style={{ marginLeft: 'auto' }}>En cours</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '12px' }}>Refonte complète du site institutionnel avec nouveau CMS, optimisation SEO et intégration blog.</div>
                        <div className="pbar-wrap"><div className="pbar" style={{ height: '7px' }}><div className="pfill" style={{ width: '72%' }}></div></div><span className="ppct" style={{ fontSize: '13px', fontWeight: 600 }}>72%</span></div>
                    </div>
                    <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="team-stack"><div className="av" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>SA</div><div className="av" style={{ background: 'linear-gradient(135deg,#f093fb,#f5576c)' }}>KT</div><div className="av" style={{ background: 'linear-gradient(135deg,#4facfe,#00f2fe)' }}>MR</div></div>
                        <div style={{ flex: 1, fontSize: '11px', color: 'var(--text-muted)' }}>Échéance : <span style={{ color: 'var(--text)' }}>28 Mar</span></div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Budget : <span style={{ color: 'var(--accent4)' }}>68% utilisé</span></div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                    <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: 'rgba(61,138,255,0.1)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📱</div>
                            <div><div style={{ fontSize: '14px', fontWeight: 600 }}>Application Mobile</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>StartupX</div></div>
                            <span className="badge b-yellow" style={{ marginLeft: 'auto' }}>En révision</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '12px' }}>App React Native iOS/Android avec auth, paiement Stripe, géolocalisation et notifications push.</div>
                        <div className="pbar-wrap"><div className="pbar" style={{ height: '7px' }}><div className="pfill" style={{ width: '89%' }}></div></div><span className="ppct" style={{ fontSize: '13px', fontWeight: 600 }}>89%</span></div>
                    </div>
                    <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="team-stack"><div className="av" style={{ background: 'linear-gradient(135deg,#43e97b,#38f9d7)' }}>HB</div><div className="av" style={{ background: 'linear-gradient(135deg,#fa709a,#fee140)' }}>YE</div></div>
                        <div style={{ flex: 1, fontSize: '11px', color: 'var(--text-muted)' }}>Échéance : <span style={{ color: 'var(--accent3)' }}>15 Mar ⚠</span></div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Budget : <span style={{ color: 'var(--accent3)' }}>94% utilisé</span></div>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                    <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: 'rgba(255,203,71,0.1)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📣</div>
                            <div><div style={{ fontSize: '14px', fontWeight: 600 }}>Campagne Q2 2025</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BrandMax</div></div>
                            <span className="badge b-green" style={{ marginLeft: 'auto' }}>En cours</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '12px' }}>Stratégie digitale 360° : social media, SEA, emailing, brand awareness Q2.</div>
                        <div className="pbar-wrap"><div className="pbar" style={{ height: '7px' }}><div className="pfill" style={{ width: '34%' }}></div></div><span className="ppct" style={{ fontSize: '13px', fontWeight: 600 }}>34%</span></div>
                    </div>
                    <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="team-stack"><div className="av" style={{ background: 'linear-gradient(135deg,#f093fb,#f5576c)' }}>NA</div><div className="av" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>IK</div><div className="av" style={{ background: 'linear-gradient(135deg,#fccb90,#d57eeb)' }}>LM</div></div>
                        <div style={{ flex: 1, fontSize: '11px', color: 'var(--text-muted)' }}>Échéance : <span style={{ color: 'var(--text)' }}>12 Avr</span></div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Budget : <span style={{ color: 'var(--accent4)' }}>34% utilisé</span></div>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', opacity: 0.8 }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.opacity = '1'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.opacity = '0.8'; }}>
                    <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: 'rgba(167,139,250,0.1)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🎨</div>
                            <div><div style={{ fontSize: '14px', fontWeight: 600 }}>Design System</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Interne</div></div>
                            <span className="badge b-gray" style={{ marginLeft: 'auto' }}>En pause</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '12px' }}>Bibliothèque de composants UI, tokens design, documentation Storybook.</div>
                        <div className="pbar-wrap"><div className="pbar" style={{ height: '7px' }}><div className="pfill" style={{ width: '55%', background: 'linear-gradient(90deg,var(--accent5),var(--accent2))' }}></div></div><span className="ppct" style={{ fontSize: '13px', fontWeight: 600 }}>55%</span></div>
                    </div>
                    <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="team-stack"><div className="av" style={{ background: 'linear-gradient(135deg,#4facfe,#00f2fe)' }}>KT</div></div>
                        <div style={{ flex: 1, fontSize: '11px', color: 'var(--text-muted)' }}>Reprise : <span style={{ color: 'var(--text)' }}>Indéfinie</span></div>
                    </div>
                </div>

                {/* Card 5 */}
                <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                    <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: 'rgba(61,138,255,0.08)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📊</div>
                            <div><div style={{ fontSize: '14px', fontWeight: 600 }}>Dashboard Analytics</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Groupe Atlas</div></div>
                            <span className="badge b-blue" style={{ marginLeft: 'auto' }}>Livré ✓</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '12px' }}>Tableau de bord BI temps réel, visualisations D3.js, exports PDF/Excel.</div>
                        <div className="pbar-wrap"><div className="pbar" style={{ height: '7px' }}><div className="pfill" style={{ width: '100%', background: 'var(--accent2)' }}></div></div><span className="ppct" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent2)' }}>100%</span></div>
                    </div>
                    <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="team-stack"><div className="av" style={{ background: 'linear-gradient(135deg,#43e97b,#38f9d7)' }}>SA</div><div className="av" style={{ background: 'linear-gradient(135deg,#fa709a,#fee140)' }}>MR</div></div>
                        <div style={{ flex: 1, fontSize: '11px', color: 'var(--text-muted)' }}>Livré le <span style={{ color: 'var(--accent)' }}>1 Mar 2025</span></div>
                    </div>
                </div>

                {/* New project card */}
                <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', borderStyle: 'dashed' }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                    <div className="empty-state" style={{ padding: '50px 20px' }}>
                        <div className="empty-ico">＋</div>
                        <p style={{ color: 'var(--accent)' }}>Créer un nouveau projet</p>
                        <p style={{ fontSize: '12px', marginTop: '5px' }}>Client, budget, équipe, dates</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
