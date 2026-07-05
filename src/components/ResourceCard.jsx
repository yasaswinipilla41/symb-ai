import React from 'react';

function ResourceCard({ item, onClick, isAdmin, onEdit, onDelete }) {
  const stop = (e, fn) => {
    e.stopPropagation();
    e.preventDefault();
    fn && fn(item);
  };

  return (
    <div
      className="resource-card"
      role="button"
      tabIndex="0"
      onClick={() => onClick(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(item);
        }
      }}
    >
      <div className="resource-header">
        <div className="resource-brand">
          <div className="resource-logo">{item.name.charAt(0)}</div>
          <div className="resource-title">{item.name}</div>
        </div>
        <div className="resource-header-right">
          {item.badges && item.badges.length > 0 && (
            <div className="resource-badges">
              {item.badges.map((b, i) => (
                <span key={i} className={`badge-${b.toLowerCase()}`}>{b}</span>
              ))}
            </div>
          )}
          {isAdmin && (
            <div className="card-admin-actions">
              <span
                role="button"
                tabIndex={0}
                title="Edit card"
                onClick={(e) => stop(e, onEdit)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && stop(e, onEdit)}
              >✏️</span>
              <span
                role="button"
                tabIndex={0}
                title="Delete card"
                onClick={(e) => stop(e, onDelete)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && stop(e, onDelete)}
              >🗑️</span>
            </div>
          )}
        </div>
      </div>
      <p className="resource-desc">{item.description}</p>
      <div className="resource-footer">
        {item.tags && item.tags.map((t, i) => (
          <span key={i} className="resource-tag">{t}</span>
        ))}
      </div>
    </div>
  );
}

export default ResourceCard;
