import React, { useState } from 'react';
import { Star, Send, Lightbulb, Bug, MessageSquare } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { feedback as feedbackApi } from '../../../lib/backend';

const KINDS = [
  { key: 'rating', label: 'Rate the portal', icon: Star },
  { key: 'suggestion', label: 'Suggest an AI tool', icon: Lightbulb },
  { key: 'issue', label: 'Report an issue', icon: Bug },
];

function FeedbackPage() {
  const { user } = useAuth();
  const [kind, setKind] = useState('rating');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await feedbackApi.insert({
      user_id: user?.id || null,
      kind,
      rating: kind === 'rating' ? rating : null,
      message,
    });
    setBusy(false);
    setSent(true);
    setRating(0);
    setMessage('');
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="dash-page">
      <h2 className="dash-h2">Feedback</h2>
      <p className="dash-muted">Help us improve — rate the portal, suggest tools, or report issues.</p>

      <form className="panel feedback-panel" onSubmit={submit}>
        <div className="seg-control">
          {KINDS.map((k) => {
            const Icon = k.icon;
            return (
              <button type="button" key={k.key} className={`seg ${kind === k.key ? 'active' : ''}`} onClick={() => setKind(k.key)}>
                <Icon size={16} /> {k.label}
              </button>
            );
          })}
        </div>

        {kind === 'rating' && (
          <div className="rating-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} className={`star ${n <= rating ? 'on' : ''}`} onClick={() => setRating(n)} aria-label={`${n} star`}>
                <Star size={26} />
              </button>
            ))}
          </div>
        )}

        <label className="field">
          <span>{kind === 'suggestion' ? 'Which tool should we add?' : kind === 'issue' ? 'Describe the issue' : 'Anything else?'}</span>
          <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder={kind === 'suggestion' ? 'e.g. Add support for…' : 'Tell us more…'} />
        </label>

        <div className="form-actions">
          <button className="btn btn-primary" disabled={busy}><Send size={16} /> {busy ? 'Sending…' : 'Submit feedback'}</button>
          {sent && <span className="save-ok"><MessageSquare size={14} /> Thanks for your feedback!</span>}
        </div>
      </form>
    </div>
  );
}

export default FeedbackPage;
