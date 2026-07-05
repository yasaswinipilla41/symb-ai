import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, ShieldOff, Ban, CheckCircle2, Trash2, UserCog, X } from 'lucide-react';
import { profiles, quizAttempts } from '../../../lib/backend';
import { useAuth } from '../../../lib/AuthContext';
import { roleLabel } from '../../../lib/roles';

function StatusBadge({ status }) {
  return <span className={`status-badge ${status}`}>{status}</span>;
}

function UserManagement() {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    const [pf, qa] = await Promise.all([profiles.list(), quizAttempts.listAll()]);
    setUsers(pf.data || []);
    setAttempts(qa.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const patchLocal = (userId, patch) =>
    setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, ...patch } : u)));

  const setRole = async (u, role) => { await profiles.setRole(u.user_id, role); patchLocal(u.user_id, { role }); };
  const setStatus = async (u, status) => { await profiles.setStatus(u.user_id, status); patchLocal(u.user_id, { status }); };
  const remove = async (u) => {
    if (!window.confirm(
      `Permanently delete ${u.full_name || u.email}?\n\nThis erases their account and ALL of their data (quizzes, bookmarks, history). This cannot be undone.`
    )) return;
    const { error } = await profiles.remove(u.user_id);
    if (error) {
      window.alert(error.message || 'Could not delete this user.');
      return;
    }
    setUsers((prev) => prev.filter((x) => x.user_id !== u.user_id));
    setSelected(null);
  };

  const attemptsByUser = useMemo(() => {
    const m = {};
    for (const a of attempts) {
      (m[a.user_id] = m[a.user_id] || []).push(a);
    }
    return m;
  }, [attempts]);

  const filtered = users.filter((u) =>
    [u.full_name, u.email, u.employee_id].filter(Boolean).some((v) => v.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="dash-page">
      <div className="page-toolbar">
        <div>
          <h2 className="dash-h2">Student Management</h2>
          <p className="dash-muted">{users.length} registered student{users.length === 1 ? '' : 's'}.</p>
        </div>
        <div className="input-wrap search-inline">
          <Search size={16} />
          <input placeholder="Search name, email, ID…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className="empty-hint">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="empty-hint">No users found.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Photo</th><th>User</th><th>Employee ID</th><th>Role</th><th>Status</th><th>Quizzes</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const ua = attemptsByUser[u.user_id] || [];
                const isSelf = u.user_id === me?.id;
                return (
                  <tr key={u.user_id}>
                    <td onClick={() => navigate(`/admin/student/${u.user_id}`)} style={{ cursor: 'pointer' }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="Profile" className="dash-avatar sm" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className="dash-avatar sm">{(u.full_name || u.email || '?').charAt(0).toUpperCase()}</div>
                      )}
                    </td>
                    <td onClick={() => navigate(`/admin/student/${u.user_id}`)} style={{ cursor: 'pointer' }}>
                      <div className="cell-user">
                        <div>
                          <strong className="hover-underline">{u.full_name || '—'}</strong>
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{u.employee_id || '—'}</td>
                    <td><span className={`role-badge ${u.role}`}>{roleLabel(u.role)}</span></td>
                    <td><StatusBadge status={u.status} /></td>
                    <td>{ua.length}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn sm" title="View Profile" onClick={() => navigate(`/admin/student/${u.user_id}`)}><UserCog size={15} /></button>
                        {u.role === 'admin'
                          ? <button className="icon-btn sm" title="Revoke admin" disabled={isSelf} onClick={() => setRole(u, 'user')}><ShieldOff size={15} /></button>
                          : <button className="icon-btn sm" title="Make admin" onClick={() => setRole(u, 'admin')}><Shield size={15} /></button>}
                        {u.status === 'banned'
                          ? <button className="icon-btn sm" title="Unban" onClick={() => setStatus(u, 'active')}><CheckCircle2 size={15} /></button>
                          : <button className="icon-btn sm" title="Ban" disabled={isSelf} onClick={() => setStatus(u, 'banned')}><Ban size={15} /></button>}
                        {u.status === 'inactive'
                          ? <button className="icon-btn sm" title="Activate" onClick={() => setStatus(u, 'active')}><CheckCircle2 size={15} /></button>
                          : <button className="icon-btn sm" title="Deactivate" disabled={isSelf} onClick={() => setStatus(u, 'inactive')}><ShieldOff size={15} /></button>}
                        <button className="icon-btn sm danger" title="Delete" disabled={isSelf} onClick={() => remove(u)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

export default UserManagement;
