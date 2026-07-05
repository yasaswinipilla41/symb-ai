import React, { useEffect, useState } from 'react';
import { Star, Lightbulb, Bug, MessageSquare } from 'lucide-react';
import { feedback as feedbackApi, profiles } from '../../../lib/backend';

const KIND_META = {
  rating: { icon: Star, label: 'Rating' },
  suggestion: { icon: Lightbulb, label: 'Suggestion' },
  issue: { icon: Bug, label: 'Issue' },
};

function AdminFeedback() {
  const [items, setItems] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      const [fb, pf] = await Promise.all([feedbackApi.listAll(), profiles.list()]);
      setItems(fb.data || []);
      const map = {};
      (pf.data || []).forEach((p) => { map[p.user_id] = p; });
      setUserMap(map);
    })();
  }, []);

  const filtered = filter === 'all' ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="dash-page">
      <div className="page-toolbar">
        <div>
          <h2 className="dash-h2">Feedback</h2>
          <p className="dash-muted">{items.length} submission{items.length === 1 ? '' : 's'}.</p>
        </div>
        <div className="filter-chips">
          {['all', 'rating', 'suggestion', 'issue'].map((k) => (
            <button key={k} className={`chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
              {k === 'all' ? 'All' : KIND_META[k].label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-hint">No feedback in this view yet.</p>
      ) : (
        <div className="feedback-list">
          {filtered.map((f) => {
            const meta = KIND_META[f.kind] || { icon: MessageSquare, label: f.kind };
            const Icon = meta.icon;
            const u = userMap[f.user_id];
            return (
              <div className="feedback-item" key={f.id}>
                <div className="feedback-icon"><Icon size={18} /></div>
                <div className="feedback-content">
                  <div className="feedback-meta">
                    <strong>{u?.full_name || 'Anonymous'}</strong>
                    <span className="feedback-kind">{meta.label}</span>
                    {f.kind === 'rating' && (
                      <span className="feedback-stars">{'★'.repeat(f.rating || 0)}{'☆'.repeat(5 - (f.rating || 0))}</span>
                    )}
                    <span className="feedback-date">{new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                  {f.message && <p>{f.message}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminFeedback;
