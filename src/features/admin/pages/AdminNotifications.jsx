import React, { useEffect, useState } from 'react';
import { Send, Megaphone, Bell } from 'lucide-react';
import { notifications } from '../../../lib/backend';

function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const load = async () => {
    const { data } = await notifications.listAll();
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const broadcast = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    await notifications.broadcast(title.trim(), body.trim());
    setBusy(false);
    setTitle(''); setBody('');
    setSent(true);
    setTimeout(() => setSent(false), 2500);
    load();
  };

  return (
    <div className="dash-page">
      <h2 className="dash-h2">Notifications</h2>
      <p className="dash-muted">Broadcast announcements and highlight new resources.</p>

      <div className="dash-two-col">
        <form className="panel" onSubmit={broadcast}>
          <div className="panel-head"><h3><Megaphone size={16} /> New broadcast</h3></div>
          <label className="field">
            <span>Title</span>
            <div className="input-wrap"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New quiz available!" /></div>
          </label>
          <label className="field">
            <span>Message</span>
            <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details for all users…" />
          </label>
          <div className="form-actions">
            <button className="btn btn-primary" disabled={busy}><Send size={16} /> {busy ? 'Sending…' : 'Send to all users'}</button>
            {sent && <span className="save-ok">Broadcast sent ✓</span>}
          </div>
        </form>

        <section className="panel">
          <div className="panel-head"><h3><Bell size={16} /> Sent notifications</h3></div>
          {items.length === 0 ? (
            <p className="empty-hint">No notifications sent yet.</p>
          ) : (
            <ul className="mini-list">
              {items.map((n) => (
                <li key={n.id}>
                  <span className="mini-dot amber" />
                  <div>
                    <span className="mini-title">{n.title}</span>
                    {n.body && <span className="mini-sub">{n.body}</span>}
                  </div>
                  <span className="mini-time">{new Date(n.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminNotifications;
