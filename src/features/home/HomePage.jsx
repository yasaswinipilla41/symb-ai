// HomePage — the main hub after the cover page. Header w/ nav + search,
// hero banner, featured / categories / popular / recently-added / trending /
// recommended sections, documentation cards, and the professional footer.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, FileText, Presentation, Trophy } from 'lucide-react';
import { getIcon } from '../../lib/icons';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import ResourcePreviewCard from '../../components/portal/ResourcePreviewCard';
import { useAuth } from '../../lib/AuthContext';
import { bookmarks as bookmarksApi } from '../../lib/backend';
import {
  featuredResources, categoryList, popularResources,
  recentResources, trendingResources, totalResourceCount,
} from '../../lib/catalog';

function Section({ id, title, sub, link = '/explore', items, bookmarkSet, onToggle }) {
  return (
    <section className="section" id={id}>
      <div className="section-head">
        <div>
          <h2 className="section-title">{title}</h2>
          {sub && <p className="section-sub">{sub}</p>}
        </div>
        <Link to={link} className="section-link">View all <ArrowRight size={16} /></Link>
      </div>
      <div className="preview-grid">
        {items.map((r) => (
          <ResourcePreviewCard
            key={r.name}
            item={r}
            bookmarked={bookmarkSet?.has(r.name)}
            onToggleBookmark={onToggle}
          />
        ))}
      </div>
    </section>
  );
}

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookmarkSet, setBookmarkSet] = useState(new Set());

  const cats = categoryList();

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) return;
      const { data } = await bookmarksApi.listForUser(user.id);
      if (active && data) setBookmarkSet(new Set(data.map((b) => b.resource_name)));
    })();
    return () => { active = false; };
  }, [user]);

  const toggleBookmark = (name) => {
    setBookmarkSet((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  return (
    <div className="portal-page">
      <PortalHeader />

      {/* HERO BANNER */}
      <section className="home-banner">
        <div className="home-banner-inner">
          <div>
            <h1>Everything you need to learn AI tooling — in one place.</h1>
            <p>{totalResourceCount()}+ curated resources across {cats.length} categories, with learning materials and quizzes.</p>
            <div className="hero-cta">
              <Link to="/explore" className="btn btn-primary btn-lg">Explore Resources <ArrowRight size={18} /></Link>
              {!user && <Link to="/register" className="btn btn-outline btn-lg">Create account</Link>}
              {user && <Link to="/dashboard" className="btn btn-outline btn-lg">My Dashboard</Link>}
            </div>
          </div>
          <div className="home-banner-cards" aria-hidden="true">
            {featuredResources(3).map((r) => (
              <div key={r.name} className="floaty-card">
                <div className="preview-logo">{r.name.charAt(0)}</div>
                <strong>{r.name}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section id="featured" title="Featured AI Resources" sub="Start here." items={featuredResources(6)} bookmarkSet={bookmarkSet} onToggle={toggleBookmark} />

      {/* CATEGORIES */}
      <section className="section alt" id="categories">
        <div className="section-head">
          <div>
            <h2 className="section-title">Categories</h2>
            <p className="section-sub">Jump straight to what you need.</p>
          </div>
        </div>
        <div className="cat-chip-grid">
          {cats.map((c) => {
            const Icon = getIcon(c.icon);
            return (
              <Link key={c.slug} to={`/explore?cat=${c.slug}`} className="cat-chip">
                <span className="cat-chip-icon"><Icon size={18} /></span>
                <span className="cat-chip-label">{c.label}</span>
                <span className="cat-chip-count">{c.count}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <Section id="popular" title="Popular Resources" sub="Most-viewed picks." items={popularResources(8)} bookmarkSet={bookmarkSet} onToggle={toggleBookmark} />
      <Section id="recent" title="Recently Added" sub="Fresh in the catalog." items={recentResources(8)} bookmarkSet={bookmarkSet} onToggle={toggleBookmark} />
      <Section id="trending" title="Trending Resources" sub="Gaining momentum." items={trendingResources(6)} bookmarkSet={bookmarkSet} onToggle={toggleBookmark} />
      <Section id="recommended" title="Recommended For You" sub={user ? 'Based on your activity.' : 'Sign in for personalized picks.'} items={popularResources(6).slice().reverse()} bookmarkSet={bookmarkSet} onToggle={toggleBookmark} />

      {/* DOCUMENTATION CARDS */}
      <section className="section" id="about">
        <div className="section-head">
          <div>
            <h2 className="section-title">Learning &amp; Documentation</h2>
            <p className="section-sub">Every tool ships with materials and an assessment.</p>
          </div>
        </div>
        <div className="doc-cards">
          <div className="doc-card"><BookOpen size={22} /><h4>Guided Docs</h4><p>Best-practice guides &amp; model tips inside each resource.</p><button className="btn btn-ghost btn-sm" onClick={() => navigate('/explore')}>Open</button></div>
          <div className="doc-card"><Presentation size={22} /><h4>Editable PPTs</h4><p>Open, edit and download slide decks in-portal.</p><span className="soon">Coming in your dashboard</span></div>
          <div className="doc-card"><FileText size={22} /><h4>Editable PDFs</h4><p>Annotate and save PDFs without external tools.</p><span className="soon">Coming in your dashboard</span></div>
          <div className="doc-card"><Trophy size={22} /><h4>Quizzes</h4><p>20 questions per tool with instant scoring.</p><span className="soon">Coming in your dashboard</span></div>
        </div>
      </section>

      <PortalFooter />
    </div>
  );
}

export default HomePage;
