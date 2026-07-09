import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, GraduationCap, FileText, Presentation, BookOpen } from 'lucide-react';
import { allResources, categoryList } from '../../../lib/catalog';

// Learning Materials catalog — every resource has an intermediate-level PDF +
// PPT study module. Students (and admins) open one to study, then take the quiz.
function MaterialsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const base = location.pathname.startsWith('/admin') ? '/admin' : '/dashboard';
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  const resources = useMemo(() => allResources(), []);
  const cats = useMemo(() => categoryList().filter((c) => c.count > 0), []);

  const filtered = resources.filter((r) => {
    const matchesQ = r.name.toLowerCase().includes(q.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(q.toLowerCase());
    const matchesCat = cat === 'all' || r.category === cat;
    return matchesQ && matchesCat;
  });

  return (
    <div className="dash-page">
      <div className="page-toolbar">
        <div>
          <h2 className="dash-h2"><GraduationCap size={22} style={{ verticalAlign: '-4px' }} /> Learning Materials</h2>
          <p className="dash-muted">Every resource has an intermediate PDF &amp; PPT module. Study, then pass the quiz (70%) to earn a certificate.</p>
        </div>
        <div className="toolbar-controls">
          <div className="input-wrap cat-select">
            <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
              <option value="all">All categories ({resources.length})</option>
              {cats.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label} ({c.count})</option>
              ))}
            </select>
          </div>
          <div className="input-wrap search-inline">
            <Search size={16} />
            <input placeholder="Search materials…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-hint">No materials match your search.</p>
      ) : (
        <div className="material-grid">
          {filtered.map((r) => (
            <button className="material-card" key={r.name}
              onClick={() => navigate(`${base}/materials/${encodeURIComponent(r.name)}`)}>
              <div className="material-card-top">
                <div className="preview-logo">{r.name.charAt(0)}</div>
                <div className="material-kinds">
                  <span title="PDF included"><FileText size={14} /></span>
                  <span title="PPT included"><Presentation size={14} /></span>
                </div>
              </div>
              <h4>{r.name}</h4>
              <p className="material-card-desc">{r.description || 'Learning module'}</p>
              <span className="material-card-cta"><BookOpen size={14} /> Study module</span>
            </button>
          ))}
        </div>
      )}
      <p className="empty-hint" style={{ marginTop: '1rem' }}>Showing {filtered.length} of {filtered.length}.</p>
    </div>
  );
}

export default MaterialsPage;
