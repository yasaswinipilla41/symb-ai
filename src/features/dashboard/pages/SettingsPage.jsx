import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, Monitor, Globe, Bell, Save, KeyRound, User, Settings } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { useTheme } from '../../../lib/ThemeContext';
import { useLanguage } from '../../../lib/LanguageContext';
import { LANGUAGES } from '../../../lib/i18n';
import { profiles } from '../../../lib/backend';

function SettingsPage() {
  const { user, profile, refreshProfile, updatePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();

  // Tab selection
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'preferences' || tab === 'profile') {
      setActiveTab(tab);
    } else {
      setActiveTab('profile');
    }
  }, [location]);

  // Profile states
  const [form, setForm] = useState({ full_name: '', department: '', avatar_url: '' });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');

  // Preferences states
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        department: profile.department || '',
        avatar_url: profile.avatar_url || '',
      });
      setNotify(profile.notify !== false);
    }
  }, [profile]);

  // Profile handlers
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const saveProfile = async (e) => {
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
    if (pw.next.length < 6) return setPwMsg(t('Password must be at least 6 characters.'));
    if (pw.next !== pw.confirm) return setPwMsg(t('Passwords do not match.'));
    const { error } = await updatePassword(pw.next);
    setPwMsg(error ? error.message : t('Password updated.'));
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

  // Preferences handlers
  const applyTheme = async (value) => {
    if (value === 'system') {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else {
      setTheme(value);
    }
    await profiles.update(user.id, { theme: value });
    refreshProfile();
  };

  const saveLang = async (value) => {
    setLang(value);
    await profiles.update(user.id, { language: value });
    refreshProfile();
  };

  const toggleNotify = async () => {
    const next = !notify;
    setNotify(next);
    await profiles.update(user.id, { notify: next });
    refreshProfile();
  };

  const themeOptions = [
    { key: 'light', label: t('Light'), icon: Sun },
    { key: 'dark', label: t('Dark'), icon: Moon },
    { key: 'system', label: t('System'), icon: Monitor },
  ];

  return (
    <div className="dash-page">
      <h2 className="dash-h2">{t('Settings')}</h2>
      <p className="dash-muted">{t('Manage your profile and portal preferences.')}</p>

      {/* Tabs */}
      <div className="seg-control" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`seg ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} /> {t('Profile')}
        </button>
        <button
          className={`seg ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <Settings size={16} /> {t('Preferences')}
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="dash-two-col">
          <form className="panel" onSubmit={saveProfile}>
            <div className="panel-head"><h3><User size={16} /> {t('Account details')}</h3></div>

            <div className="profile-avatar-row">
              <div className="profile-avatar">{form.avatar_url ? <img src={form.avatar_url} alt="" /> : initial}</div>
              <label className="field grow">
                <span>{t('Profile picture URL')}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div className="input-wrap" style={{ flexGrow: 1 }}>
                    <input value={form.avatar_url} onChange={setField('avatar_url')} placeholder="https://…" />
                  </div>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} id="avatar-upload" style={{ display: 'none' }} />
                  <label htmlFor="avatar-upload" className="btn btn-outline" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    {t('Browse')}
                  </label>
                </div>
              </label>
            </div>

            <label className="field">
              <span>{t('Full name')}</span>
              <div className="input-wrap"><input value={form.full_name} onChange={setField('full_name')} /></div>
            </label>

            <label className="field">
              <span>{t('Department')}</span>
              <div className="input-wrap"><input value={form.department} onChange={setField('department')} placeholder={t('Optional')} /></div>
            </label>

            <label className="field">
              <span>{t('Email')}</span>
              <div className="input-wrap"><input value={profile?.email || user?.email || ''} disabled /></div>
            </label>

            <div className="form-actions">
              <button className="btn btn-primary" disabled={busy}><Save size={16} /> {busy ? t('Saving…') : t('Save changes')}</button>
              {saved && <span className="save-ok">{t('Saved ✓')}</span>}
            </div>
          </form>

          {!isGoogleAccount && (
            <form className="panel" onSubmit={changePassword}>
              <div className="panel-head"><h3><KeyRound size={16} /> {t('Change password')}</h3></div>
              <label className="field">
                <span>{t('New password')}</span>
                <div className="input-wrap"><input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="••••••••" /></div>
              </label>
              <label className="field">
                <span>{t('Confirm new password')}</span>
                <div className="input-wrap"><input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" /></div>
              </label>
              {pwMsg && <div className={`inline-msg ${pwMsg.includes('updated') ? 'ok' : 'err'}`}>{pwMsg}</div>}
              <div className="form-actions">
                <button className="btn btn-outline"><KeyRound size={16} /> {t('Update password')}</button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'preferences' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <section className="panel">
            <div className="panel-head"><h3>{t('Appearance')}</h3></div>
            <div className="seg-control">
              {themeOptions.map((o) => {
                const Icon = o.icon;
                const active = o.key === 'dark' ? theme === 'dark' : o.key === 'light' ? theme === 'light' : (profile?.theme === 'system');
                return (
                  <button key={o.key} className={`seg ${active ? 'active' : ''}`} onClick={() => applyTheme(o.key)}>
                    <Icon size={16} /> {o.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h3><Globe size={16} /> {t('Language')}</h3></div>
            <label className="field">
              <div className="input-wrap">
                <select value={lang} onChange={(e) => saveLang(e.target.value)}>
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </label>
          </section>

          <section className="panel">
            <div className="panel-head"><h3><Bell size={16} /> {t('Notifications')}</h3></div>
            <label className="switch-row">
              <span>{t('Receive portal notifications & announcements')}</span>
              <button type="button" className={`switch ${notify ? 'on' : ''}`} onClick={toggleNotify} aria-pressed={notify}>
                <span className="switch-knob" />
              </button>
            </label>
          </section>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
