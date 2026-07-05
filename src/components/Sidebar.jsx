import React from 'react';

// Sidebar — category navigation for the Explore page. The section/link model is
// computed by useResourcesStore and passed in as `sections`. Admins get inline
// controls to rename/delete each link and to add a new link per section.

function Sidebar({
  sections,
  totalCount,
  activeCategory,
  setActiveCategory,
  isAdmin,
  onAddLink,
  onEditCategory,
  onDeleteCategory,
}) {
  return (
    <aside className="sidebar">
      <a
        href="#all"
        className={`nav-link ${activeCategory === 'all' ? 'active' : ''}`}
        style={{ marginBottom: '1.5rem' }}
        onClick={(e) => { e.preventDefault(); setActiveCategory('all'); }}
      >
        <span>All Resources</span>
        <span className="badge">{totalCount}</span>
      </a>

      {sections.map((section) => (
        <div className="nav-section" key={section.title}>
          <div className="nav-section-title">{section.title}</div>

          {section.links.map((link) => (
            <div className="nav-link-row" key={link.slug}>
              <a
                href={`#${link.slug}`}
                className={`nav-link ${activeCategory === link.slug ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveCategory(link.slug); }}
              >
                <span>{link.label}</span>
                <span className="badge">{link.count}</span>
              </a>
              {isAdmin && (
                <div className="nav-admin-actions">
                  <span
                    role="button"
                    tabIndex={0}
                    title="Rename link"
                    onClick={() => onEditCategory(link.slug)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onEditCategory(link.slug)}
                  >✏️</span>
                  <span
                    role="button"
                    tabIndex={0}
                    title="Delete link"
                    onClick={() => onDeleteCategory(link.slug)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onDeleteCategory(link.slug)}
                  >🗑️</span>
                </div>
              )}
            </div>
          ))}

          {isAdmin && (
            <button type="button" className="add-link-btn" onClick={() => onAddLink(section.title)}>
              + Add Link
            </button>
          )}
        </div>
      ))}
    </aside>
  );
}

export default Sidebar;
