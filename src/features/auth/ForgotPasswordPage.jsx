import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, MailCheck } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../lib/AuthContext';

function ForgotPasswordPage() {
  const { resetPassword, backendMode } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await resetPassword(email);
    setBusy(false);
    setSent(true);
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a secure reset link."
      footer={<>Remembered it? <Link to="/login">Back to sign in</Link></>}
    >
      {sent ? (
        <div className="auth-success">
          <MailCheck size={40} />
          <p>If an account exists for <strong>{email}</strong>, a reset link is on its way.</p>
          {backendMode === 'mock' && (
            <p className="auth-note">Demo mode: password reset emails aren't sent offline. Connect Supabase to enable real emails.</p>
          )}
          <Link to="/login" className="btn btn-primary btn-block">Back to sign in</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={onSubmit}>
          <label className="field">
            <span>Email</span>
            <div className="input-wrap">
              <Mail size={16} />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
          </label>
          <button className="btn btn-primary btn-block" disabled={busy}>
            <Send size={16} /> {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
