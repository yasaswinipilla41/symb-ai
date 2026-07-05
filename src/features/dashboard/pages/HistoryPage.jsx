import React, { useEffect, useMemo, useState } from 'react';
import { LogIn, LogOut, Eye, FileText, Presentation, Trophy, Download, Search as SearchIcon, Filter } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { history as historyApi } from '../../../lib/backend';

const TYPE_META = {
  login: { icon: LogIn, label: 'Login' },
  logout: { icon: LogOut, label: 'Logout' },
  view: { icon: Eye, label: 'Viewed' },
  pdf: { icon: FileText, label: 'PDF' },
  ppt: { icon: Presentation, label: 'PPT' },
  quiz: { icon: Trophy, label: 'Quiz' },
  download: { icon: Download, label: 'Download' },
  search: { icon: SearchIcon, label: 'Search' },
};

function HistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await historyApi.listForUser(user.id);
      if (active) { setItems(data || []); setLoading(false); }
    })();
    return () => { active = false; };
  }, [user]);

  const types = useMemo(() => ['all', ...Array.from(new Set(items.map((i) => i.type)))], [items]);
  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter);

  return (
    <div className="dash-page">
      <div className="page-toolbar">
        <div>
          <h2 className="dash-h2">Activity History</h2>
          <p className="dash-muted">Your complete, permanent activity timeline.</p>
        </div>
        <div className="filter-chips">
          <Filter size={15} />
          {types.map((t) => (
            <button key={t} className={`chip ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
              {t === 'all' ? 'All' : TYPE_META[t]?.label || t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="empty-hint">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="empty-hint">No history in this view yet.</p>
      ) : (
        <ol className="timeline">
          {filtered.map((h) => {
            const meta = TYPE_META[h.type] || { icon: Eye, label: h.type };
            const Icon = meta.icon;
            return (
              <li key={h.id} className="timeline-item">
                <span className="timeline-icon"><Icon size={15} /></span>
                <div className="timeline-body">
                  <div className="timeline-row">
                    <strong>{h.title || meta.label}</strong>
                    <span className="timeline-badge">{meta.label}</span>
                  </div>
                  <span className="timeline-time">{new Date(h.created_at).toLocaleString()}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default HistoryPage;
