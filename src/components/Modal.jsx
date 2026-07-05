import React, { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { bookmarks as bookmarksApi } from '../lib/backend';

// Default Details
function createDefaultPopupDetails(resource) {
  return {
    overview: resource.description,
    sections: [
      {
        title: 'Project Rules',
        html: `Add a <code>.rules</code> file to your project root. Many tools read it automatically each session — great for enforcing conventions without repeating yourself.`
      },
      {
        title: 'Key Shortcuts',
        html: `<ul class="detail-list"><li><strong>Ctrl+B</strong> — toggle file explorer</li><li><strong>Ctrl+Alt+B</strong> — toggle AI agents panel</li></ul>`
      },
      {
        title: 'Tips',
        html: `<ul class="detail-list"><li>Use <code>@codebase</code> in chat to search your whole project before asking questions.</li><li>When Composer makes a mistake, keep iterating in the same thread.</li><li>Short, specific prompts beat long explanations.</li><li>Review the diff before accepting, especially on config files.</li></ul>`
      }
    ]
  };
}

// Category-specific Models configuration
const categoryModels = {
  'ai-tools': {
    headers: ['Model', 'When to use'],
    rows: [
      ['claude-sonnet-4.6', 'Default for everything — coding, refactoring, debugging'],
      ['claude-opus-4', 'Only for genuinely complex tasks: deep architecture decisions, hard bugs'],
      ['Avoid: Auto', 'Auto-selects models unpredictably and often generates low-quality or irrelevant code']
    ]
  },
  'frameworks-agents': {
    headers: ['Model', 'When to use'],
    rows: [
      ['claude-sonnet-4.6', 'Good default for prototyping and integration work'],
      ['claude-opus-4', 'Reach for Opus for large-scale architecture or complex orchestration logic'],
      ['Avoid: Auto', 'Auto-selection can be unpredictable for multi-actor workflows']
    ]
  },
  'mcp-tools': {
    headers: ['Model', 'When to use'],
    rows: [
      ['claude-sonnet-4.6', 'Default for queries, schema analysis, and data summaries'],
      ['claude-opus-4', 'For deep data reasoning and cross-dataset joins']
    ]
  },
  'data-analytics': {
    headers: ['Model', 'When to use'],
    rows: [
      ['claude-sonnet-4.6', 'Default for data summaries and transformations'],
      ['claude-opus-4', 'For complex statistical reasoning or causal analysis']
    ]
  },
  'default': {
    headers: ['Model', 'When to use'],
    rows: [
      ['claude-sonnet-4.6', 'Default for general usage'],
      ['claude-opus-4', 'Use for especially difficult reasoning tasks']
    ]
  }
};

function getResourcePopupDetails(resource, category) {
  const defaultDetails = createDefaultPopupDetails(resource);
  const models = categoryModels[category] || categoryModels['default'];

  const custom = resource?.popupDetails || {};
  const customSections = custom.sections || [];

  const hasModelsInCustom = customSections.some(s => s.title && s.title.toLowerCase().trim() === 'models');
  const mergedSections = [];
  if (hasModelsInCustom) {
    mergedSections.push(...customSections);
  } else {
    mergedSections.push({ title: 'Models', table: models });
    mergedSections.push(...customSections);
  }

  const presentTitles = mergedSections.map(s => s.title);
  for (const def of defaultDetails.sections) {
    if (!presentTitles.includes(def.title)) mergedSections.push(def);
  }

  return {
    overview: custom.overview || defaultDetails.overview,
    sections: mergedSections
  };
}

function Modal({ resource, onClose, database }) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [bmBusy, setBmBusy] = useState(false);

  // Setup keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && resource) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [resource, onClose]);

  // Reflect whether this resource is already bookmarked by the current user.
  useEffect(() => {
    let active = true;
    if (user && resource) {
      bookmarksApi.listForUser(user.id).then(({ data }) => {
        if (active) setBookmarked((data || []).some((b) => b.resource_name === resource.name));
      });
    } else {
      setBookmarked(false);
    }
    return () => { active = false; };
  }, [user, resource]);

  if (!resource) return null;

  const toggleBookmark = async () => {
    if (!user || bmBusy) return;
    setBmBusy(true);
    const { removed } = await bookmarksApi.toggle(user.id, resource.name, resource.url || resource.linkUrl || '');
    setBookmarked(!removed);
    setBmBusy(false);
  };

  // Find category for the resource
  let category = 'default';
  for (const key in database) {
    if (database[key].items?.find(item => item.name === resource.name)) {
      category = key;
      break;
    }
  }

  const popupDetails = getResourcePopupDetails(resource, category);

  // Actions
  const actions = [];
  if (resource.pptUrl) actions.push({ label: 'PPT', url: resource.pptUrl });
  if (resource.docUrl) actions.push({ label: 'DOC', url: resource.docUrl });
  if (resource.url || resource.linkUrl) actions.push({ label: 'Link', url: resource.url || resource.linkUrl });

  const primaryAction = actions.length > 0 ? actions[0] : null;

  const sections = popupDetails.sections.filter(
    section => section.title.toLowerCase().trim() !== 'documentation & best practices'
  );

  return (
    <div className="modal-overlay" style={{ display: 'grid' }} onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close resource details">
          &times;
        </button>
        <div className="modal-summary">
          <div className="modal-summary-info">
            <div className="resource-logo">{resource.name.charAt(0)}</div>
            <div className="modal-summary-text">
              <div className="modal-title-row">
                <h2>{resource.name}</h2>
                <div className="modal-badges">
                  {resource.badges && resource.badges.map((b, i) => (
                    <span key={i} className={`badge-${b.toLowerCase()}`}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="f-row">
            <p className="modal-resource-subtitle">Choose a resource option below.</p>
            {user && (
              <button
                type="button"
                className={`resource-action-btn bookmark-toggle ${bookmarked ? 'active' : ''}`}
                onClick={toggleBookmark}
                disabled={bmBusy}
                title={bookmarked ? 'Remove bookmark' : 'Bookmark this resource'}
              >
                <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
            )}
            {primaryAction && (
              <button
                type="button"
                className="resource-action-btn resource-action-primary"
                onClick={() => window.open(primaryAction.url, '_blank', 'noopener')}
              >
                {primaryAction.label === 'Link' ? 'Visit' : primaryAction.label}
              </button>
            )}
          </div>
        </div>
        
        <div className="modal-details">
          <div className="detail-heading">Documentation & Best Practices</div>
          {popupDetails.overview ? (
             <p className="detail-overview">{popupDetails.overview}</p>
          ) : (
             <p className="detail-overview">{resource.description || 'Choose a resource option below.'}</p>
          )}

          {sections.map((section, i) => (
            <div className="detail-section" key={i}>
              <div className="detail-section-title">{section.title}</div>
              {section.table ? (
                <div className="detail-table-wrapper">
                  <table className="detail-table">
                    <thead>
                      <tr>
                        {section.table.headers.map((h, j) => <th key={j}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="detail-section-content" dangerouslySetInnerHTML={{ __html: section.html || `<p>${section.content}</p>` }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Modal;
