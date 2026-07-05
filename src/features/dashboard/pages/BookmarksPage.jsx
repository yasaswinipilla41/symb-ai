import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, Trash2, Bookmark, BookOpen } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { bookmarks as bookmarksApi } from '../../../lib/backend';
import { findResource, categoryMeta } from '../../../lib/catalog';

function BookmarksPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await bookmarksApi.listForUser(user.id);
    // Enrich each bookmark with its catalog category for filtering.
    const enriched = (data || []).map((b) => {
      const res = findResource(b.resource_name);
      return { ...b, category: res?.category || null, description: res?.description || '' };
    });
    setItems(enriched);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user]);

  const remove = async (id) => {
    await bookmarksApi.remove(id);
    setItems((prev) => prev.filter((b) => b.id !== id));
  };

  // Categories present among the user's bookmarks.
  const cats = useMemo(() => {
    const set = new Map();
    for (const b of items) {
      if (b.category) set.set(b.category, categoryMeta[b.category]?.label || b.category);
    }
    return [...set.entries()].map(([slug, label]) => ({ slug, label }));
  }, [items]);

  const filtered = items.filter((b) => {
    const matchesQ = b.resource_name.toLowerCase().includes(q.toLowerCase());
    const matchesCat = cat === 'all' || b.category === cat;
    return matchesQ && matchesCat;
  });

  return (
    <div className="dash-page">
      <div className="page-toolbar">
        <div>
          <h2 className="dash-h2">Bookmarks</h2>
          <p className="dash-muted">{items.length} saved resource{items.length === 1 ? '' : 's'}.</p>
        </div>
        <div className="input-wrap search-inline">
          <Search size={16} />
          <input placeholder="Search bookmarks…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {cats.length > 0 && (
        <div className="chip-row">
          <button className={`chip ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>All ({items.length})</button>
          {cats.map((c) => (
            <button key={c.slug} className={`chip ${cat === c.slug ? 'active' : ''}`} onClick={() => setCat(c.slug)}>{c.label}</button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="empty-hint">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Bookmark size={40} />
          <p>{items.length === 0 ? 'No bookmarks yet. Open any resource and tap “Bookmark”.' : 'No bookmarks match your filter.'}</p>
          <Link to="/explore" className="btn btn-primary btn-sm">Explore resources</Link>
        </div>
      ) : (
        <div className="bookmark-grid">
          {filtered.map((b) => (
            <div className="bookmark-card" key={b.id}>
              <div className="preview-logo">{b.resource_name.charAt(0)}</div>
              <div className="bookmark-body">
                <strong>{b.resource_name}</strong>
                {b.category && <span className="bookmark-cat">{categoryMeta[b.category]?.label || b.category}</span>}
                <span>{new Date(b.created_at).toLocaleDateString()}</span>
              </div>
              <div className="bookmark-actions">
                <Link className="icon-btn sm" to={`/dashboard/materials/${encodeURIComponent(b.resource_name)}`} aria-label="Study"><BookOpen size={15} /></Link>
                {b.resource_url && (
                  <a className="icon-btn sm" href={b.resource_url} target="_blank" rel="noopener" aria-label="Visit"><ExternalLink size={15} /></a>
                )}
                <button className="icon-btn sm danger" onClick={() => remove(b.id)} aria-label="Remove"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookmarksPage;
