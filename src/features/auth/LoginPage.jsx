import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import AuthLayout from './AuthLayout';
import GoogleIcon from '../../components/GoogleIcon';
import { useAuth } from '../../lib/AuthContext';
import { profiles } from '../../lib/backend';
import { isBootstrapAdmin } from '../../lib/supabaseClient';

function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const onGoogle = async () => {
    setError('');
    setGoogleBusy(true);
    const { error: err } = await signInWithGoogle();
    // On success the browser redirects to Google, so we only get here on error.
    if (err) {
      setError(err.message || 'Unable to sign in with Google.');
      setGoogleBusy(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { data, error: err } = await signIn({ email, password });
    setBusy(false);
    if (err) {
      setError(err.message || 'Unable to sign in.');
      return;
    }
    // Route by role — admins land on the admin console.
    let role = 'user';
    const uid = data?.user?.id;
    if (uid) {
      const { data: prof } = await profiles.get(uid);
      if (prof?.role === 'admin' || isBootstrapAdmin(email || data?.user?.email || prof?.email)) {
        role = 'admin';
      }
    }
    navigate(from === '/dashboard' && role === 'admin' ? '/admin' : from, { replace: true });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your learning portal."
      footer={<>New here? <Link to="/register">Create an account</Link></>}
    >
      <button type="button" className="btn btn-google btn-block" onClick={onGoogle} disabled={googleBusy || busy}>
        <GoogleIcon /> {googleBusy ? 'Redirecting…' : 'Continue with Google'}
      </button>

      <div className="auth-divider"><span>or sign in with email</span></div>

      <form className="auth-form" onSubmit={onSubmit}>
        {error && <div className="form-error">{error}</div>}

        <label className="field">
          <span>Email</span>
          <div className="input-wrap">
            <Mail size={16} />
            <input type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
        </label>

        <label className="field">
          <span>Password</span>
          <div className="input-wrap">
            <Lock size={16} />
            <input type={showPw ? 'text' : 'password'} required autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" className="input-adorn" onClick={() => setShowPw((s) => !s)} aria-label="Toggle password">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <div className="auth-row">
          <Link to="/forgot-password" className="auth-link-sm">Forgot password?</Link>
        </div>

        <button className="btn btn-primary btn-block" disabled={busy}>
          <LogIn size={16} /> {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
