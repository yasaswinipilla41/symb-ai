import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, BookmarkPlus, BookmarkCheck, Play, Globe } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { bookmarks as bookmarksApi, history } from '../../lib/backend';

function ResourcePreviewCard({ item, bookmarked = false, onToggleBookmark }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const url = item.url || item.linkUrl || '#';

  const openExplore = (e) => {
    e?.stopPropagation();
    if (user) history.log(user.id, 'view', item.name, { url });
    navigate(`/explore?q=${encodeURIComponent(item.name)}`);
  };

  const visit = (e) => {
    e.stopPropagation();
    if (user) history.log(user.id, 'view', item.name, { url, action: 'visit' });
    window.open(url, '_blank', 'noopener');
  };

  const openQuiz = (e) => {
    e.stopPropagation();
    if (!user) {
      setShowModal(true);
      return;
    }
    navigate(`/dashboard/quizzes/${encodeURIComponent(item.name)}`);
  };

  const toggleBookmark = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    await bookmarksApi.toggle(user.id, item.name, url);
    onToggleBookmark && onToggleBookmark(item.name);
  };

  return (
    <>
      <div className="preview-card-wrapper" role="button" tabIndex={0} 
        onKeyDown={(e) => { if (e.key === 'Enter') openExplore(e); }}>
        <div className="preview-card-inner">
          {/* FRONT OF CARD */}
          <div className="preview-card preview-card-front" onClick={openExplore}>
            <div className="preview-card-top">
              <div className="preview-logo">{item.name.charAt(0)}</div>
              <div className="preview-card-actions">
                <button className="icon-btn sm" onClick={toggleBookmark} aria-label="Bookmark" title="Bookmark">
                  {bookmarked ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
                </button>
                <button className="icon-btn sm" onClick={visit} aria-label="Visit website" title="Visit website">
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>
            <h4 className="preview-title">{item.name}</h4>
            <p className="preview-desc">{item.description}</p>
            <div className="preview-tags">
              {(item.badges || []).map((b, i) => <span key={`b${i}`} className={`badge-${b.toLowerCase()}`}>{b}</span>)}
              {(item.tags || []).slice(0, 2).map((t, i) => <span key={`t${i}`} className="preview-tag">{t}</span>)}
            </div>
          </div>

          {/* BACK OF CARD */}
          <div className="preview-card preview-card-back">
             <div className="back-content">
               <h4 className="preview-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>{item.name}</h4>
               <div className="back-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                 <button className="btn btn-outline btn-block" onClick={openExplore}>
                   <Globe size={16} /> Visit Resources
                 </button>
                 <button className="btn btn-primary btn-block" onClick={openQuiz}>
                   <Play size={16} /> Start Quiz
                 </button>
               </div>
             </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ display: 'grid' }} onClick={() => setShowModal(false)}>
          <div className="modal-panel sm" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem' }}>Authentication Required</h3>
            <p style={{ color: 'var(--text-muted)' }}>You must be logged in first to participate in the quiz.</p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>Login</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ResourcePreviewCard;
