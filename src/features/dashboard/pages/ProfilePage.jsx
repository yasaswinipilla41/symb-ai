import React, { useEffect, useState } from 'react';
import { Save, KeyRound, User } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { profiles } from '../../../lib/backend';

function ProfilePage() {
  const { user, profile, refreshProfile, updatePassword } = useAuth();
  const [form, setForm] = useState({ full_name: '', department: '', avatar_url: '' });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const [pw, setPw] = useState({ next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        department: profile.department || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    await profiles.update(user.id, form);
    await refreshProfile();
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (pw.next.length < 6) return setPwMsg('Password must be at least 6 characters.');
    if (pw.next !== pw.confirm) return setPwMsg('Passwords do not match.');
    const { error } = await updatePassword(pw.next);
    setPwMsg(error ? error.message : 'Password updated.');
    if (!error) setPw({ next: '', confirm: '' });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm((f) => ({ ...f, avatar_url: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const isGoogleAccount = user?.app_metadata?.provider === 'google' || user?.identities?.[0]?.provider === 'google' || user?.email?.endsWith('@gmail.com');
  const initial = (form.full_name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="dash-page">
      <h2 className="dash-h2">Profile</h2>
      <p className="dash-muted">Manage your account details.</p>

      <div className="dash-two-col">
        <form className="panel" onSubmit={save}>
          <div className="panel-head"><h3><User size={16} /> Account details</h3></div>

          <div className="profile-avatar-row">
            <div className="profile-avatar">{form.avatar_url ? <img src={form.avatar_url} alt="" /> : initial}</div>
            <label className="field grow">
              <span>Profile picture URL</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="input-wrap" style={{ flexGrow: 1 }}>
                  <input value={form.avatar_url} onChange={set('avatar_url')} placeholder="https://…" />
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} id="avatar-upload" style={{ display: 'none' }} />
                <label htmlFor="avatar-upload" className="btn btn-outline" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  Browse
                </label>
              </div>
            </label>
          </div>

          <label className="field">
            <span>Full name</span>
            <div className="input-wrap"><input value={form.full_name} onChange={set('full_name')} /></div>
          </label>

          <label className="field">
            <span>Department</span>
            <div className="input-wrap"><input value={form.department} onChange={set('department')} placeholder="Optional" /></div>
          </label>

          <label className="field">
            <span>Email</span>
            <div className="input-wrap"><input value={profile?.email || user?.email || ''} disabled /></div>
          </label>

          <div className="form-actions">
            <button className="btn btn-primary" disabled={busy}><Save size={16} /> {busy ? 'Saving…' : 'Save changes'}</button>
            {saved && <span className="save-ok">Saved ✓</span>}
          </div>
        </form>

        {!isGoogleAccount && (
          <form className="panel" onSubmit={changePassword}>
            <div className="panel-head"><h3><KeyRound size={16} /> Change password</h3></div>
            <label className="field">
              <span>New password</span>
              <div className="input-wrap"><input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="••••••••" /></div>
            </label>
            <label className="field">
              <span>Confirm new password</span>
              <div className="input-wrap"><input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" /></div>
            </label>
            {pwMsg && <div className={`inline-msg ${pwMsg.includes('updated') ? 'ok' : 'err'}`}>{pwMsg}</div>}
            <div className="form-actions">
              <button className="btn btn-outline"><KeyRound size={16} /> Update password</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
