// CoverPage — the first screen users see. AI-themed hero, featured resources,
// category preview, popular preview, and clear CTAs (Login / Register / Explore).

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, GraduationCap, ShieldCheck, BarChart3 } from 'lucide-react';
import { getIcon } from '../../lib/icons';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import ResourcePreviewCard from '../../components/portal/ResourcePreviewCard';
import { featuredResources, categoryList, popularResources, totalResourceCount } from '../../lib/catalog';
import { useAuth } from '../../lib/AuthContext';

function CategoryChip({ cat }) {
  const Icon = getIcon(cat.icon);
  return (
    <Link to={`/explore?cat=${cat.slug}`} className="cat-chip">
      <span className="cat-chip-icon"><Icon size={18} /></span>
      <span className="cat-chip-label">{cat.label}</span>
      <span className="cat-chip-count">{cat.count}</span>
    </Link>
  );
}

function CoverPage() {
  const { user, signOut } = useAuth();
  const featured = featuredResources(6);
  const cats = categoryList().slice(0, 12);
  const popular = popularResources(4);
  const total = totalResourceCount();

  return (
    <div className="portal-page">
      <PortalHeader />

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-inner">
          <span className="hero-eyebrow"><Sparkles size={14} /> Learning &amp; Assessment Portal</span>
          <h1 className="hero-title">
            Master the modern <span className="grad">AI &amp; developer toolchain</span>
          </h1>
          <p className="hero-sub">
            A curated knowledge base of {total}+ AI tools, frameworks, and platforms — now with
            guided learning materials, quizzes, and progress tracking. Learn it, get assessed, and
            level up your team.
          </p>
          <div className="hero-cta">
            <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary btn-lg">Get Started <ArrowRight size={18} /></Link>
            {user ? (
              <button onClick={() => signOut()} className="btn btn-outline btn-lg">Logout</button>
            ) : (
              <Link to="/login" className="btn btn-outline btn-lg">Login</Link>
            )}
            <Link to="/explore" className="btn btn-ghost btn-lg">Explore Resources</Link>
          </div>
          <div className="hero-stats">
            <div><strong>{total}+</strong><span>Resources</span></div>
            <div><strong>{categoryList().length}</strong><span>Categories</span></div>
            <div><strong>20</strong><span>Quiz Qs / tool</span></div>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="value-strip">
        <div className="value-item"><GraduationCap size={22} /><div><strong>Guided Learning</strong><span>Editable PPT &amp; PDF per tool</span></div></div>
        <div className="value-item"><ShieldCheck size={22} /><div><strong>Secure Access</strong><span>Role-based auth &amp; sessions</span></div></div>
        <div className="value-item"><BarChart3 size={22} /><div><strong>Track Progress</strong><span>Scores, history &amp; analytics</span></div></div>
      </section>

      {/* FEATURED */}
      <section className="section">
        <div className="section-head">
          <div>
            <h2 className="section-title">Featured AI Resources</h2>
            <p className="section-sub">Hand-picked tools worth learning first.</p>
          </div>
          <Link to="/explore" className="section-link">View all <ArrowRight size={16} /></Link>
        </div>
        <div className="preview-grid">
          {featured.map((r) => <ResourcePreviewCard key={r.name} item={r} />)}
        </div>
      </section>

      {/* CATEGORIES */}
      {/* <section className="section alt">
        <div className="section-head">
          <div>
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-sub">Everything organized the way you work.</p>
          </div>
          <Link to="/explore" className="section-link">All categories <ArrowRight size={16} /></Link>
        </div>
        <div className="cat-chip-grid">
          {cats.map((c) => <CategoryChip key={c.slug} cat={c} />)}
        </div>
      </section> */}

      {/* POPULAR */}
      {/* <section className="section">
        <div className="section-head">
          <div>
            <h2 className="section-title">Popular Resources</h2>
            <p className="section-sub">What teams are learning right now.</p>
          </div>
          <Link to="/explore" className="section-link">View all <ArrowRight size={16} /></Link>
        </div>
        <div className="preview-grid">
          {popular.map((r) => <ResourcePreviewCard key={r.name} item={r} />)}
        </div>
      </section> */}

      {/* CTA BANNER */}
      <section className="cta-banner">
        <div className="cta-banner-inner">
          <h2>{user ? "Continue your learning journey" : "Ready to start learning?"}</h2>
          <p>{user ? "Head to your dashboard to resume your progress and quizzes." : "Create your account and unlock dashboards, quizzes, and progress tracking."}</p>
          <div className="hero-cta">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">Go to Dashboard</Link>
            ) : (
              <Link to="/register" className="btn btn-primary btn-lg">Create free account</Link>
            )}
            <Link to="/explore" className="btn btn-outline btn-lg">Browse resources</Link>
          </div>
        </div>
      </section>

      <PortalFooter />
    </div>
  );
}

export default CoverPage;
