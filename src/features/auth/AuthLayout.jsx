import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

// Shared two-pane layout for all auth screens.
function AuthLayout({ title, subtitle, children, footer }) {
  const { backendMode } = useAuth();
  return (
    <div className="auth-shell">
      <aside className="auth-aside" aria-hidden="true">
        <div className="auth-aside-glow" />
        <Link to="/" className="portal-brand light">
          <span className="portal-brand-mark"><Sparkles size={18} /></span>
          <span className="portal-brand-text">AI Tools Portal<span className="dot">°</span></span>
        </Link>
        <div className="auth-aside-body">
          <h2>Learn. Assess. Grow.</h2>
          <p>Access curated AI resources, guided learning materials, and quizzes — all in one secure portal.</p>
          <ul className="auth-aside-list">
            <li>Role-based dashboards for students &amp; admins</li>
            <li>Editable PPT/PDF learning materials</li>
            <li>Quizzes with permanent score history</li>
          </ul>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <Link to="/" className="portal-brand auth-brand-mobile">
            <span className="portal-brand-mark"><Sparkles size={18} /></span>
            <span className="portal-brand-text">AI Tools Portal<span className="dot">°</span></span>
          </Link>
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {backendMode === 'mock' && (
            <div className="auth-note">
              Demo mode — data is stored locally in your browser. Add Supabase keys to go live.
            </div>
          )}
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
