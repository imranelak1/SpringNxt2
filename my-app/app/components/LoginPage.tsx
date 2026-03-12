'use client';
import { useState } from 'react';

type Role = 'admin' | 'pm' | 'employee';

interface LoginPageProps {
    onLogin: (role: Role) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<Role>('pm');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) { setError('Veuillez remplir tous les champs.'); return; }
        setLoading(true);
        setError('');
        // Simulate auth
        setTimeout(() => {
            setLoading(false);
            onLogin(selectedRole);
        }, 900);
    };

    const roles: { key: Role; label: string; icon: string }[] = [
        { key: 'admin', label: 'Administrateur', icon: '🛡' },
        { key: 'pm', label: 'Chef de Projet', icon: '📋' },
        { key: 'employee', label: 'Employé', icon: '👤' },
    ];

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="logo-mark">N</div>
                    <div className="logo-text">NEX<span>US</span></div>
                </div>
                <div className="login-title">Bienvenue 👋</div>
                <div className="login-sub">Connectez-vous à votre espace de travail intelligent</div>

                <div className="role-pills">
                    {roles.map(r => (
                        <div key={r.key} className={`role-pill ${selectedRole === r.key ? 'active' : ''}`} onClick={() => setSelectedRole(r.key)}>
                            {r.icon}<br /><span style={{ fontSize: '11px', marginTop: '2px', display: 'block' }}>{r.label}</span>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Adresse email</label>
                        <input className="form-input" type="email" placeholder="sofia@nexus.ma" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Mot de passe</label>
                        <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>

                    {error && <div style={{ fontSize: '12px', color: 'var(--accent3)', marginBottom: '14px', background: 'rgba(255,107,107,0.08)', padding: '8px 12px', borderRadius: '7px' }}>{error}</div>}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <input type="checkbox" style={{ accentColor: 'var(--accent)' }} /> Se souvenir de moi
                        </label>
                        <span style={{ fontSize: '12px', color: 'var(--accent)', cursor: 'pointer' }}>Mot de passe oublié ?</span>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? <span>Connexion en cours...</span> : <span>Se connecter →</span>}
                    </button>
                </form>

                <div style={{ marginTop: '24px', padding: '14px', background: 'var(--surface2)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Accès démonstration</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                        Sélectionnez un rôle ci-dessus puis entrez<br />
                        <strong style={{ color: 'var(--text)' }}>demo@nexus.ma</strong> / <strong style={{ color: 'var(--text)' }}>demo123</strong>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Plateforme sécurisée — JWT + bcrypt ·{' '}
                    <span style={{ color: 'var(--accent)' }}>HTTPS</span>
                </div>
            </div>
        </div>
    );
}
