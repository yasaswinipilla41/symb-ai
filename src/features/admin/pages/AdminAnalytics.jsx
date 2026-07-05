import React, { useEffect, useState } from 'react';
import { BarChart, LineChart } from '../../../components/dashboard/MiniChart';
import { history as historyApi, quizAttempts, profiles } from '../../../lib/backend';

// Aggregate helpers ---------------------------------------------------------
function topBy(rows, keyFn, n = 6) {
  const counts = {};
  for (const r of rows) {
    const k = keyFn(r);
    if (!k) continue;
    counts[k] = (counts[k] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, value]) => ({ label: label.length > 10 ? label.slice(0, 9) + '…' : label, value }));
}

function last7Days(rows) {
  const days = [];
  const base = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    const value = rows.filter((r) => (r.created_at || '').slice(0, 10) === key).length;
    days.push({ label, value });
  }
  return days;
}

function AdminAnalytics() {
  const [hist, setHist] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    (async () => {
      const [hs, qa, pf] = await Promise.all([historyApi.listAll(), quizAttempts.listAll(), profiles.list()]);
      setHist(hs.data || []);
      setAttempts(qa.data || []);
      setUsers(pf.data || []);
    })();
  }, []);

  const mostVisited = topBy(hist.filter((h) => h.type === 'view'), (h) => h.title);
  const mostQuizzed = topBy(attempts, (a) => a.resource_name);
  const dailyVisits = last7Days(hist.filter((h) => h.type === 'view'));
  const userGrowth = last7Days(users);
  const searches = topBy(hist.filter((h) => h.type === 'search'), (h) => h.title);

  // Resolve a display name for an attempt's user from the loaded profiles.
  const userName = (uid) => {
    const p = users.find((u) => u.user_id === uid || u.id === uid);
    return p?.full_name || p?.email || 'Unknown';
  };

  const highest = [...attempts].sort((a, b) => b.percentage - a.percentage).slice(0, 5);
  const lowest = [...attempts].sort((a, b) => a.percentage - b.percentage).slice(0, 5);

  const hasData = hist.length > 0 || attempts.length > 0;

  return (
    <div className="dash-page">
      <h2 className="dash-h2">Analytics</h2>
      <p className="dash-muted">Interactive insights across the portal.</p>

      {!hasData && (
        <div className="info-banner">
          No activity has been recorded yet. Charts populate as users browse resources and take quizzes.
        </div>
      )}

      <div className="chart-grid">
        <section className="panel">
          <div className="panel-head"><h3>Most Visited Resources</h3></div>
          {mostVisited.length ? <BarChart data={mostVisited} /> : <p className="empty-hint">No visits yet.</p>}
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Daily Visits (7 days)</h3></div>
          <LineChart data={dailyVisits} />
        </section>

        <section className="panel">
          <div className="panel-head"><h3>User Growth (7 days)</h3></div>
          <LineChart data={userGrowth} />
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Most Attempted Quizzes</h3></div>
          {mostQuizzed.length ? <BarChart data={mostQuizzed} /> : <p className="empty-hint">No quiz attempts yet.</p>}
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Search Analytics</h3></div>
          {searches.length ? <BarChart data={searches} /> : <p className="empty-hint">No searches tracked yet.</p>}
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Score Extremes</h3></div>
          <div className="score-cols">
            <div>
              <h4 className="detail-subhead">Highest</h4>
              {highest.length ? (
                <table className="score-table">
                  <thead>
                    <tr><th>Resource</th><th>User</th><th className="num">Score</th><th className="num">Rank</th></tr>
                  </thead>
                  <tbody>
                    {highest.map((a, i) => (
                      <tr key={a.id}>
                        <td>{a.resource_name}</td>
                        <td className="score-user">{userName(a.user_id)}</td>
                        <td className="num ok">{Math.round(a.percentage)}%</td>
                        <td className="num rank">{i + 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="empty-hint">—</p>}
            </div>
            <div>
              <h4 className="detail-subhead">Lowest</h4>
              {lowest.length ? (
                <table className="score-table">
                  <thead>
                    <tr><th>Resource</th><th>User</th><th className="num">Score</th><th className="num">Rank</th></tr>
                  </thead>
                  <tbody>
                    {lowest.map((a, i) => (
                      <tr key={a.id}>
                        <td>{a.resource_name}</td>
                        <td className="score-user">{userName(a.user_id)}</td>
                        <td className="num err">{Math.round(a.percentage)}%</td>
                        <td className="num rank">{i + 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="empty-hint">—</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminAnalytics;
