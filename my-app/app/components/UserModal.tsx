'use client';
import { useState } from 'react';

interface UserModalProps {
    onClose: () => void;
    mode?: 'create' | 'edit';
    initial?: { name: string; email: string; role: string; };
}

export default function UserModal({ onClose, mode = 'create', initial }: UserModalProps) {
    const [name, setName] = useState(initial?.name || '');
    const [email, setEmail] = useState(initial?.email || '');
    const [role, setRole] = useState(initial?.role || 'employee');
    const [password, setPassword] = useState('');

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <div className="modal-title">{mode === 'create' ? '＋ Nouvel utilisateur' : '✏ Modifier l\'utilisateur'}</div>
                    <div className="modal-close" onClick={onClose}>✕</div>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Nom complet *</label>
                        <input className="form-input" placeholder="Ex: Hassan Benjelloun" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Adresse email *</label>
                        <input className="form-input" type="email" placeholder="hassan@nexus.ma" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Rôle</label>
                        <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                            <option value="admin">Administrateur</option>
                            <option value="pm">Chef de Projet</option>
                            <option value="employee">Employé</option>
                        </select>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                            {role === 'admin' && '🛡 Accès complet à la plateforme et gestion des utilisateurs'}
                            {role === 'pm' && '📋 Création et gestion de projets, accès à toutes les vues analytiques'}
                            {role === 'employee' && '👤 Accès à son tableau de bord personnel et aux tâches assignées'}
                        </div>
                    </div>
                    {mode === 'create' && (
                        <div className="form-group">
                            <label className="form-label">Mot de passe temporaire</label>
                            <input className="form-input" type="password" placeholder="Générer automatiquement si vide" value={password} onChange={e => setPassword(e.target.value)} />
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>Un email de bienvenue sera envoyé automatiquement</div>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
                    <button className="btn btn-primary" onClick={onClose}>
                        {mode === 'create' ? '＋ Créer l\'utilisateur' : '💾 Enregistrer'}
                    </button>
                </div>
            </div>
        </div>
    );
}
