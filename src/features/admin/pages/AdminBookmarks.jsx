import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Search, Trash2, TrendingUp, Users } from 'lucide-react';
import { bookmarks as bookmarksApi, profiles } from '../../../lib/backend';
import { findResource, categoryMeta } from '../../../lib/catalog';

// Admin bookmark oversight: analytics on what students save most, plus the
// ability to manage/remove any bookmark (e.g. inappropriate entries).
function AdminBookmarks() {
  const [rows, setRows] = useState([]);
  const [people, setPeople] = useState({});
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [bk, pf] = await Promise.all([bookmarksApi.listAll(), profiles.list()]);
    setRows(bk.data || []);
    const map = {};
    for (const p of pf.data || []) map[p.user_id] = p;
    setPeople(map);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm('Remove this bookmark?')) return;
    await bookmarksApi.remove(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Analytics: most-bookmarked resources.
  const topResources = useMemo(() => {
    const counts = {};
    for (const r of rows) counts[r.resource_name] = (counts[r.resource_name] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [rows]);

  const uniqueStudents = useMemo(() => new Set(rows.map((r) => r.user_id)).size, [rows]);

  const filtered = rows.filter((r) => {
    const person = people[r.user_id];
    return [r.resource_name, person?.full_name, person?.email]
      .filter(Boolean).some((v) => v.toLowerCase().includes(q.toLowerCase()));
  });

  return (
    <div className="dash-page">
      <div className="page-toolbar">
        <div>
          <h2 className="dash-h2">Bookmark Analytics</h2>
          <p className="dash-muted">{rows.length} bookmark{rows.length === 1 ? '' : 's'} across {uniqueStudents} student{uniqueStudents === 1 ? '' : 's'}.</p>
        </div>
        <div className="input-wrap search-inline">
          <Search size={16} />
          <input placeholder="Search resource, student…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card tone-violet"><div className="stat-icon"><Bookmark size={20} /></div><div className="stat-body"><span className="stat-value">{rows.length}</span><span className="stat-label">Total bookmarks</span></div></div>
        <div className="stat-card tone-blue"><div className="stat-icon"><Users size={20} /></div><div className="stat-body"><span className="stat-value">{uniqueStudents}</span><span className="stat-label">Students bookmarking</span></div></div>
        <div className="stat-card tone-green"><div className="stat-icon"><TrendingUp size={20} /></div><div className="stat-body"><span className="stat-value">{topResources[0]?.[1] || 0}</span><span className="stat-label">Top resource saves</span></div></div>
      </div>

      {loading ? (
        <p className="empty-hint">Loading…</p>
      ) : (
        <div className="dash-two-col">
          <section className="panel">
            <div className="panel-head"><h3><TrendingUp size={16} /> Most bookmarked</h3></div>
            {topResources.length === 0 ? <p className="empty-hint">No bookmarks yet.</p> : (
              <ul className="rank-list">
                {topResources.map(([name, count], i) => (
                  <li key={name}>
                    <span className="rank-pos">{i + 1}</span>
                    <span className="rank-name">{name}
                      {findResource(name)?.category && <em className="rank-cat">{categoryMeta[findResource(name).category]?.label}</em>}
                    </span>
                    <span className="rank-score">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="panel-head"><h3><Bookmark size={16} /> All bookmarks</h3></div>
            {filtered.length === 0 ? <p className="empty-hint">No bookmarks found.</p> : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Resource</th><th>Student</th><th>Saved</th><th></th></tr></thead>
                  <tbody>
                    {filtered.slice(0, 100).map((r) => (
                      <tr key={r.id}>
                        <td>{r.resource_name}</td>
                        <td>{people[r.user_id]?.full_name || people[r.user_id]?.email || '—'}</td>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td><button className="icon-btn sm danger" onClick={() => remove(r.id)} aria-label="Remove"><Trash2 size={15} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminBookmarks;
