import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Crown, Award } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { profiles as profilesApi, quizAttempts } from '../../../lib/backend';
import { buildLeaderboard } from '../../../lib/leaderboard';

function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [pf, qa] = await Promise.all([profilesApi.list(), quizAttempts.listAll()]);
      if (active) { setRows(buildLeaderboard(pf.data || [], qa.data || [])); setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const me = rows.find((r) => r.userId === user?.id);

  return (
    <div className="dash-page">
      <h2 className="dash-h2"><Trophy size={22} style={{ verticalAlign: '-4px' }} /> Leaderboard</h2>
      <p className="dash-muted">Ranked by average score, courses completed, then completion time.</p>

      {me && (
        <div className="lb-me">
          <Crown size={18} />
          <span>You are ranked <strong>#{me.rank}</strong> of {rows.length} — avg {me.avgScore}%, {me.coursesCompleted} course{me.coursesCompleted === 1 ? '' : 's'} completed.</span>
        </div>
      )}

      {loading ? (
        <p className="empty-hint">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="empty-state"><Trophy size={40} /><p>No ranked students yet. Take a quiz to join the board!</p></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table lb-table">
            <thead>
              <tr><th>Rank</th><th>Student</th><th>Avg Score</th><th>Completed</th><th>Certificates</th><th>Attempts</th></tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((r) => (
                <tr key={r.userId} className={r.userId === user?.id ? 'lb-row-me' : ''}>
                  <td>
                    <span className="lb-rank">
                      {r.rank === 1 ? <Crown size={16} className="lb-gold" />
                        : r.rank === 2 ? <Medal size={16} className="lb-silver" />
                        : r.rank === 3 ? <Medal size={16} className="lb-bronze" />
                        : `#${r.rank}`}
                    </span>
                  </td>
                  <td>
                    <div className="cell-user">
                      <div className="dash-avatar sm">{(r.name || '?').charAt(0).toUpperCase()}</div>
                      <div><strong>{r.name}</strong>{r.userId === user?.id && <span className="lb-you"> You</span>}</div>
                    </div>
                  </td>
                  <td><strong>{r.avgScore}%</strong></td>
                  <td>{r.coursesCompleted}</td>
                  <td><span className="lb-cert"><Award size={14} /> {r.certificates}</span></td>
                  <td>{r.attemptsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;
