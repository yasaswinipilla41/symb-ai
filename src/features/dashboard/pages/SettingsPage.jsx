import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor, Globe, Bell } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { useTheme } from '../../../lib/ThemeContext';
import { useLanguage } from '../../../lib/LanguageContext';
import { LANGUAGES } from '../../../lib/i18n';
import { profiles } from '../../../lib/backend';

function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    if (profile) {
      setNotify(profile.notify !== false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const applyTheme = async (value) => {
    // 'system' resolves to OS preference for the live toggle.
    if (value === 'system') {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else {
      setTheme(value);
    }
    await profiles.update(user.id, { theme: value });
    refreshProfile();
  };

  const saveLang = async (value) => {
    setLang(value); // switch the live UI language immediately
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
      <p className="dash-muted">{t('Personalize your experience.')}</p>

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
  );
}

export default SettingsPage;
