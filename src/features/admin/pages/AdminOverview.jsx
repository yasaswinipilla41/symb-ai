import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Boxes, FolderTree, Eye, Trophy, Percent, Activity, ArrowRight } from 'lucide-react';
import { profiles, history as historyApi, quizAttempts, activityLogs } from '../../../lib/backend';
import { totalResourceCount, categoryList } from '../../../lib/catalog';

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-icon"><Icon size={20} /></div>
      <div className="stat-body">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

function AdminOverview() {
  const [s, setS] = useState({ users: 0, active: 0, visits: 0, quizzes: 0, avg: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [pf, hs, qa, al] = await Promise.all([
        profiles.list(), historyApi.listAll(), quizAttempts.listAll(), activityLogs.listAll(),
      ]);
      if (!active) return;
      const users = pf.data || [];
      const attempts = qa.data || [];
      const avg = attempts.length ? Math.round(attempts.reduce((a, x) => a + (Number(x.percentage) || 0), 0) / attempts.length) : 0;
      setS({
        users: users.length,
        active: users.filter((u) => u.status === 'active').length,
        visits: (hs.data || []).filter((h) => h.type === 'view').length,
        quizzes: attempts.length,
        avg,
      });
      setRecent((al.data || []).slice(0, 8));
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="dash-page">
      <h2 className="dash-h2">Overview</h2>
      <p className="dash-muted">Portal health at a glance.</p>

      <div className="stat-grid four">
        <Stat icon={Users} label="Total students" value={s.users} tone="blue" />
        <Stat icon={UserCheck} label="Active students" value={s.active} tone="green" />
        <Stat icon={Boxes} label="Total resources" value={totalResourceCount()} tone="violet" />
        <Stat icon={FolderTree} label="Categories" value={categoryList().length} tone="amber" />
        <Stat icon={Eye} label="Total visits" value={s.visits} tone="blue" />
        <Stat icon={Trophy} label="Quiz attempts" value={s.quizzes} tone="amber" />
        <Stat icon={Percent} label="Average score" value={`${s.avg}%`} tone="green" />
        <Stat icon={Activity} label="Active now" value={s.active} tone="violet" />
      </div>

      <div className="dash-two-col">
        <section className="panel">
          <div className="panel-head">
            <h3>Recent Activity</h3>
            <Link to="/admin/users" className="section-link">Manage students <ArrowRight size={15} /></Link>
          </div>
          {recent.length === 0 ? (
            <p className="empty-hint">No activity recorded yet.</p>
          ) : (
            <ul className="mini-list">
              {recent.map((a) => (
                <li key={a.id}>
                  <span className="mini-dot" />
                  <span className="mini-title cap">{a.action}{a.detail ? ` — ${a.detail}` : ''}</span>
                  <span className="mini-time">{new Date(a.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Quick actions</h3></div>
          <div className="quick-actions">
            <Link to="/admin/users" className="qa-tile"><Users size={18} /> Manage students</Link>
            <Link to="/admin/analytics" className="qa-tile"><Activity size={18} /> View analytics</Link>
            <Link to="/admin/notifications" className="qa-tile"><Trophy size={18} /> Send notification</Link>
            <Link to="/admin/feedback" className="qa-tile"><Percent size={18} /> Review feedback</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminOverview;
