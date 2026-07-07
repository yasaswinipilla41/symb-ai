import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Award, BookOpenCheck, TrendingUp, ArrowRight, Bell, Medal, GraduationCap, Sparkles } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { roleLabel } from '../../../lib/roles';
import { bookmarks as bookmarksApi, history as historyApi, quizAttempts, profiles as profilesApi, notifications } from '../../../lib/backend';
import { summarize, buildLeaderboard } from '../../../lib/leaderboard';
import { earnedCertificates } from '../../../lib/certificates';
import { isModuleCertResource } from '../../../lib/workshops';

function StatCard({ icon: Icon, label, value, tone, sub }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-icon"><Icon size={20} /></div>
      <div className="stat-body">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

function Overview() {
  const { user, profile } = useAuth();
  const [summary, setSummary] = useState(summarize([]));
  const [rank, setRank] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [certs, setCerts] = useState([]);
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [bk, qa, allPf, allQa, nt] = await Promise.all([
        bookmarksApi.listForUser(user.id),
        quizAttempts.listForUser(user.id),
        profilesApi.list(),
        quizAttempts.listAll(),
        notifications.listAll(),
      ]);
      if (!active) return;
      const myAttempts = qa.data || [];
      setSummary(summarize(myAttempts));
      setCerts(earnedCertificates(myAttempts, user.id));
      setRecentQuizzes(myAttempts.filter((a) => !isModuleCertResource(a.resource_name)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5));
      setBookmarkCount((bk.data || []).length);

      const board = buildLeaderboard(allPf.data || [], allQa.data || []);
      setTotalStudents(board.length);
      const me = board.find((r) => r.userId === user.id);
      setRank(me ? me.rank : null);

      setNotes((nt.data || []).filter((n) => n.user_id === '*' || n.user_id === user.id || n.user_id == null).slice(0, 4));
    })();
    return () => { active = false; };
  }, [user]);

  const name = profile?.full_name || 'there';

  return (
    <div className="dash-page">
      <section className="welcome-card">
        <div>
          <p className="welcome-eyebrow">Welcome back</p>
          <h2>Hi, {name} 👋</h2>
          <p className="welcome-sub">Study a module, pass the quiz at 70%, and earn your certificate.</p>
        </div>
        <div className="welcome-meta">
          <div><span>Email</span><strong>{profile?.email || user?.email}</strong></div>
          <div><span>Role</span><strong className="cap">{roleLabel(profile?.role)}</strong></div>
        </div>
      </section>

      <div className="stat-grid">
        <StatCard icon={Medal} label="Overall Rank" tone="amber"
          value={rank ? `#${rank}` : '—'} sub={rank ? `of ${totalStudents} students` : 'Take a quiz to rank'} />
        <StatCard icon={Award} label="Certificates" tone="violet" value={summary.certificates} />
        <StatCard icon={GraduationCap} label="Courses Completed" tone="green" value={summary.coursesCompleted} sub={`${summary.coursesTaken} attempted`} />
        <StatCard icon={TrendingUp} label="Average Score" tone="blue" value={`${summary.avgScore}%`} />
      </div>

      <div className="dash-two-col">
        <section className="panel">
          <div className="panel-head">
            <h3><Trophy size={16} /> Quiz History</h3>
            <Link to="/dashboard/results" className="section-link">All results <ArrowRight size={15} /></Link>
          </div>
          {recentQuizzes.length === 0 ? (
            <p className="empty-hint">No quizzes yet. <Link to="/dashboard/quizzes">Take your first quiz →</Link></p>
          ) : (
            <ul className="mini-list">
              {recentQuizzes.map((a) => (
                <li key={a.id}>
                  <span className={`mini-dot ${a.percentage >= 70 ? 'green' : 'amber'}`} />
                  <span className="mini-title">{a.resource_name}</span>
                  <span className="mini-time">{Math.round(a.percentage)}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3><Sparkles size={16} /> Recent Achievements</h3>
            <Link to="/dashboard/certificates" className="section-link">All <ArrowRight size={15} /></Link>
          </div>
          {certs.length === 0 ? (
            <p className="empty-hint">No certificates yet. Pass a quiz at 80% to earn one.</p>
          ) : (
            <ul className="mini-list">
              {certs.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <span className="achv-badge"><Award size={14} /></span>
                  <div>
                    <span className="mini-title">{c.resourceName}</span>
                    <span className="mini-sub">{c.percentage}% · {new Date(c.date).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="dash-two-col">
        <section className="panel">
          <div className="panel-head">
            <h3><BookOpenCheck size={16} /> Keep learning</h3>
            <Link to="/dashboard/leaderboard" className="section-link">Leaderboard <ArrowRight size={15} /></Link>
          </div>
          <div className="quick-links">
            <Link to="/dashboard/materials" className="quick-link"><GraduationCap size={16} /> Learning Materials</Link>
            <Link to="/dashboard/quizzes" className="quick-link"><Trophy size={16} /> Take a Quiz</Link>
            <Link to="/dashboard/bookmarks" className="quick-link">★ Bookmarks ({bookmarkCount})</Link>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h3><Bell size={16} /> Notifications</h3></div>
          {notes.length === 0 ? (
            <p className="empty-hint">You're all caught up.</p>
          ) : (
            <ul className="mini-list">
              {notes.map((n) => (
                <li key={n.id}>
                  <span className="mini-dot amber" />
                  <div>
                    <span className="mini-title">{n.title}</span>
                    {n.body && <span className="mini-sub">{n.body}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default Overview;
