// DashboardShell — shared sidebar + topbar chrome for both the user and admin
// dashboards. Keeps the two consoles visually consistent with the rest of the
// portal (same tokens, same theme toggle).

import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Sun, Moon, LogOut, Menu, X, User, ChevronDown, ArrowLeft, Settings, KeyRound } from 'lucide-react';
import { getIcon } from '../../lib/icons';
import { useTheme } from '../../lib/ThemeContext';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';

function DashboardShell({ title, nav, children }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { profile, user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Show a Back button on every dashboard page except the module home.
  const isDashHome = location.pathname === '/dashboard' || location.pathname === '/admin';
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(isAdmin ? '/admin' : '/dashboard');
  };

  const name = profile?.full_name || user?.email || 'Student';
  const email = profile?.email || user?.email || '';
  const initial = (name || '?').charAt(0).toUpperCase();
  const profilePath = isAdmin ? '/admin/profile' : '/dashboard/settings';
  const settingsPath = isAdmin ? '/admin/settings' : '/dashboard/settings?tab=preferences';

  const onSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Close the profile dropdown on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  return (
    <div className={`dash ${open ? 'nav-open' : ''}`}>
      <aside className="dash-sidebar">
        <Link to="/" className="dash-brand">
          <span className="portal-brand-mark"><Sparkles size={16} /></span>
          <span>{t('AI Tools Portal')}</span>
        </Link>

        <nav className="dash-nav">
          {nav.map((group) => (
            <div className="dash-nav-group" key={group.label}>
              <span className="dash-nav-label">{t(group.label)}</span>
              {group.items.map((item) => {
                const Icon = getIcon(item.icon);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={17} /> <span>{t(item.label)}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="dash-sidebar-foot">
          <button className="dash-nav-link as-btn" onClick={onSignOut}><LogOut size={17} /> <span>{t('Sign out')}</span></button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <button className="icon-btn dash-menu" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="dash-title">{t(title)}</h1>
          <div className="dash-topbar-actions">
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="dash-user-menu" ref={menuRef}>
              <button
                className="dash-user as-trigger"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <div className="dash-avatar" aria-hidden="true">{initial}</div>
                <div className="dash-user-meta">
                  <strong>{name}</strong>
                  <span>{isAdmin ? t('Administrator') : t('Student')}</span>
                </div>
                <ChevronDown size={16} className={`dash-user-caret ${menuOpen ? 'up' : ''}`} />
              </button>

              {menuOpen && (
                <div className="profile-dropdown" role="menu">
                  {/* <div className="profile-dropdown-head">
                    <div className="dash-avatar lg" aria-hidden="true">{initial}</div>
                    <div className="profile-dropdown-id">
                      <strong>{name}</strong>
                      {email && <span title={email}>{email}</span>}
                    </div>
                  </div> */}
                  {/* <div className="profile-dropdown-sep" /> */}
                  <button className="profile-dropdown-item" role="menuitem"
                    onClick={() => { setMenuOpen(false); navigate(profilePath); }}>
                    <User size={16} /> <span>{t('Profile')}</span>
                  </button>
                  <button className="profile-dropdown-item" role="menuitem"
                    onClick={() => { setMenuOpen(false); navigate(settingsPath); }}>
                    <Settings size={16} /> <span>{t('Settings')}</span>
                  </button>
                  {!(user?.app_metadata?.provider === 'google' || user?.email?.endsWith('@gmail.com')) && (
                    <button className="profile-dropdown-item" role="menuitem"
                      onClick={() => { setMenuOpen(false); navigate(profilePath); }}>
                      <KeyRound size={16} /> <span>{t('Change Password')}</span>
                    </button>
                  )}
                  <button className="profile-dropdown-item danger" role="menuitem"
                    onClick={() => { setMenuOpen(false); onSignOut(); }}>
                    <LogOut size={16} /> <span>{t('Sign Out')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="dash-content">
          {!isDashHome && (
            <button className="dash-back" onClick={goBack}>
              <ArrowLeft size={16} /> <span>{t('Back')}</span>
            </button>
          )}
          {children}
        </main>
      </div>

      {open && <div className="dash-scrim" onClick={() => setOpen(false)} />}
    </div>
  );
}

export default DashboardShell;
