'use client';

export default function Calendrier() {
    const calDays = [
        { day: 1, events: [] },
        { day: 2, events: [] },
        { day: 3, events: [{ label: 'Livraison Atlas', cls: 'ev-green' }] },
        { day: 4, today: true, events: [{ label: 'Réunion TechCorp', cls: '' }, { label: 'Sprint review', cls: 'ev-yellow' }] },
        { day: 5, events: [{ label: 'Design review', cls: 'ev-purple' }] },
        { day: 6, events: [] },
        { day: 7, events: [] },
        { day: 8, events: [{ label: '⚠ API Stripe', cls: 'ev-red' }] },
        { day: 9, events: [] },
        { day: 10, events: [{ label: 'Wireframes V2', cls: 'ev-purple' }] },
        { day: 11, events: [] },
        { day: 12, events: [{ label: 'Créatives Q2', cls: '' }, { label: 'CI/CD pipeline', cls: '' }] },
        { day: 13, events: [] },
        { day: 14, events: [] },
        { day: 15, events: [{ label: '⚠ App Mobile', cls: 'ev-red' }] },
        { day: 16, events: [] },
        { day: 17, events: [] },
        { day: 18, events: [{ label: 'Point BrandMax', cls: 'ev-yellow' }] },
        { day: 19, events: [] },
        { day: 20, events: [] },
        { day: 21, events: [] },
        { day: 22, events: [] },
        { day: 23, events: [] },
        { day: 24, events: [] },
        { day: 25, events: [] },
        { day: 26, events: [] },
        { day: 27, events: [] },
        { day: 28, events: [{ label: 'Livraison TechCorp', cls: 'ev-green' }] },
        { day: 29, events: [] },
        { day: 30, events: [] },
        { day: 31, events: [] },
    ];

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <button className="btn btn-ghost btn-sm">← Fév</button>
                <div className="section-title" style={{ margin: 0, flex: 1, textAlign: 'center' }}>Mars 2025</div>
                <button className="btn btn-ghost btn-sm">Avr →</button>
                <button className="btn btn-ghost btn-sm">Mois ▾</button>
                <button className="btn btn-primary btn-sm">＋ Événement</button>
            </div>

            <div className="card mb18">
                <div style={{ padding: '16px 18px' }}>
                    <div className="cal-grid mb10">
                        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                            <div key={d} className="cal-day-lbl">{d}</div>
                        ))}
                    </div>
                    <div className="cal-grid">
                        {/* 4 empty cells before day 1 (March 2025 starts on Saturday) */}
                        <div className="cal-day empty"></div>
                        <div className="cal-day empty"></div>
                        <div className="cal-day empty"></div>
                        <div className="cal-day empty"></div>
                        {calDays.map(({ day, today, events }) => (
                            <div key={day} className={`cal-day${today ? ' today' : ''}`}>
                                <div className="cal-num">{day}</div>
                                {events?.map((ev, i) => (
                                    <div key={i} className={`cal-event ${ev.cls}`}>{ev.label}</div>
                                ))}
                            </div>
                        ))}
                        <div className="cal-day empty"></div>
                        <div className="cal-day empty"></div>
                        <div className="cal-day empty"></div>
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><div className="card-title">Événements à venir</div></div>
                    <div className="tl-item"><div className="tl-dot" style={{ background: 'var(--accent2)' }}></div><div style={{ flex: 1 }}><div className="tl-title">Réunion client — TechCorp</div><div className="tl-sub">Mar 4 Mars · 10h00 · Zoom</div></div><span className="badge b-blue" style={{ fontSize: '10px' }}>Aujourd'hui</span></div>
                    <div className="tl-item"><div className="tl-dot" style={{ background: 'var(--accent4)' }}></div><div style={{ flex: 1 }}><div className="tl-title">Sprint Review #9</div><div className="tl-sub">Mar 4 Mars · 14h30 · Présentiel</div></div><span className="badge b-yellow" style={{ fontSize: '10px' }}>Aujourd'hui</span></div>
                    <div className="tl-item"><div className="tl-dot" style={{ background: 'var(--accent3)' }}></div><div style={{ flex: 1 }}><div className="tl-title">⚠ Deadline — API Stripe</div><div className="tl-sub">Sam 8 Mars · Fin de journée</div></div><span className="badge b-red" style={{ fontSize: '10px' }}>Dans 4j</span></div>
                    <div className="tl-item"><div className="tl-dot" style={{ background: 'var(--accent5)' }}></div><div style={{ flex: 1 }}><div className="tl-title">Révision wireframes V2</div><div className="tl-sub">Lun 10 Mars · 11h00</div></div><span className="badge b-gray" style={{ fontSize: '10px' }}>Dans 6j</span></div>
                    <div className="tl-item"><div className="tl-dot" style={{ background: 'var(--accent3)' }}></div><div style={{ flex: 1 }}><div className="tl-title">⚠ Deadline — App Mobile</div><div className="tl-sub">Sam 15 Mars · Livraison finale</div></div><span className="badge b-red" style={{ fontSize: '10px' }}>Dans 11j</span></div>
                </div>
                <div className="card">
                    <div className="card-header"><div className="card-title">Charge hebdomadaire</div><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Semaine du 3 Mar</span></div>
                    <div style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { day: 'Lun', width: '90%', bg: 'rgba(79,255,176,0.3)', label: 'Réunion TechCorp · Sprint Review' },
                                { day: 'Mar', width: '50%', bg: 'rgba(61,138,255,0.25)', label: 'Développement API' },
                                { day: 'Mer', width: '65%', bg: 'rgba(167,139,250,0.2)', label: 'Design review · Wireframes' },
                                { day: 'Jeu', width: '40%', bg: 'rgba(255,203,71,0.2)', label: 'Rapport mensuel Q1' },
                                { day: 'Ven', width: '75%', bg: 'rgba(255,107,107,0.2)', label: '⚠ Deadline API Stripe · Tests QA' },
                            ].map(({ day, width, bg, label }) => (
                                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '12px', minWidth: '40px', color: 'var(--text-muted)' }}>{day}</span>
                                    <div className="pbar" style={{ height: '22px', flex: 1, borderRadius: '6px' }}>
                                        <div className="pfill" style={{ width, background: bg, borderRadius: '6px', height: '100%', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                                            <span style={{ fontSize: '11px' }}>{label}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
