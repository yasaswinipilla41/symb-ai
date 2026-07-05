// PortalHeader — the marketing/site header used on the cover & home pages.
// Distinct from the Knowledge Base's own Header (which stays untouched).

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Search, Menu, X, Sparkles, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { useAuth } from '../../lib/AuthContext';

function PortalHeader({ showNav = true }) {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/explore?q=${encodeURIComponent(q)}` : '/explore');
  };

  return (
    <header className="portal-header">
      <div className="portal-header-inner">
        <Link to="/" className="portal-brand">
          <span className="portal-brand-mark"><Sparkles size={18} /></span>
          <span className="portal-brand-text">AI Tools Portal<span className="dot">°</span></span>
        </Link>

        {showNav && (
          <nav className={`portal-nav ${open ? 'open' : ''}`}>
            <Link to="/home" onClick={() => setOpen(false)}>Home</Link>
            <a href="/home#categories" onClick={() => setOpen(false)}>Categories</a>
            <a href="/home#popular" onClick={() => setOpen(false)}>Popular Resources</a>
            <a href="/home#about" onClick={() => setOpen(false)}>About</a>
            <a href="/home#contact" onClick={() => setOpen(false)}>Contact</a>
          </nav>
        )}

        <div className="portal-header-actions">
          {/* <form className="portal-search" onSubmit={submitSearch}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search resources…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search resources"
            />
          </form> */}

          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated ? (
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="btn btn-primary btn-sm">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          ) : (
            <div className="portal-auth-btns">
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}

          <button className="icon-btn portal-menu-toggle" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default PortalHeader;
