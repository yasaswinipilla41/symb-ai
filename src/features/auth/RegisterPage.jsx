import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, BadgeCheck, Eye, EyeOff, UserPlus } from 'lucide-react';
import AuthLayout from './AuthLayout';
import GoogleIcon from '../../components/GoogleIcon';
import { useAuth } from '../../lib/AuthContext';

function RegisterPage() {
  const { signUp, signInWithGoogle, backendMode } = useAuth();
  const navigate = useNavigate();

  const [googleBusy, setGoogleBusy] = useState(false);
  const onGoogle = async () => {
    setError('');
    setGoogleBusy(true);
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(err.message || 'Unable to continue with Google.');
      setGoogleBusy(false);
    }
  };

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setBusy(true);
    const { error: err } = await signUp({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
    });
    setBusy(false);
    if (err) return setError(err.message || 'Unable to register.');

    if (backendMode === 'mock') {
      // Mock auto-confirms — send straight to login.
      navigate('/login', { replace: true });
    } else {
      setDone(true); // Supabase: wait for email verification.
    }
  };

  if (done) {
    return (
      <AuthLayout title="Check your email" subtitle="One more step to activate your account.">
        <div className="auth-success">
          <BadgeCheck size={40} />
          <p>We've sent a verification link to <strong>{form.email}</strong>. Click it to confirm your account, then sign in.</p>
          <Link to="/login" className="btn btn-primary btn-block">Go to sign in</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the AI Tools learning portal."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      <button type="button" className="btn btn-google btn-block" onClick={onGoogle} disabled={googleBusy || busy}>
        <GoogleIcon /> {googleBusy ? 'Redirecting…' : 'Continue with Google'}
      </button>

      <div className="auth-divider"><span>or register with email</span></div>

      <form className="auth-form" onSubmit={onSubmit}>
        {error && <div className="form-error">{error}</div>}

        <label className="field">
          <span>Full name</span>
          <div className="input-wrap">
            <User size={16} />
            <input required value={form.fullName} onChange={set('fullName')} placeholder="Ada Lovelace" />
          </div>
        </label>

        <label className="field">
          <span>Email</span>
          <div className="input-wrap">
            <Mail size={16} />
            <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@company.com" />
          </div>
        </label>

        <div className="field-row">
          <label className="field">
            <span>Password</span>
            <div className="input-wrap">
              <Lock size={16} />
              <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={set('password')} placeholder="••••••••" />
              <button type="button" className="input-adorn" onClick={() => setShowPw((s) => !s)} aria-label="Toggle password">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          <label className="field">
            <span>Confirm</span>
            <div className="input-wrap">
              <Lock size={16} />
              <input type={showPw ? 'text' : 'password'} required value={form.confirm} onChange={set('confirm')} placeholder="••••••••" />
            </div>
          </label>
        </div>

        <button className="btn btn-primary btn-block" disabled={busy}>
          <UserPlus size={16} /> {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
