// KnowledgeBase — the AI Tools Portal explore experience.
//
// Header + Sidebar + ResourceGrid + Modal, mounted at /explore. Admins get
// inline controls to add/edit/delete categories (nav links) and resource cards;
// changes persist to Supabase (see useResourcesStore). Everyone else sees the
// read-only catalog exactly as before.

import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import ResourceGrid from '../../components/ResourceGrid';
import Modal from '../../components/Modal';
import { ResourceFormModal, CategoryFormModal } from '../../components/EditModals';
import { useTheme } from '../../lib/ThemeContext';
import { useAuth } from '../../lib/AuthContext';
import { history } from '../../lib/backend';
import { useResourcesStore } from '../../lib/useResourcesStore';

function KnowledgeBase() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const store = useResourcesStore();
  const { catalog, sections, totalCount } = store;

  const [activeCategory, setActiveCategory] = useState(
    () => searchParams.get('cat') || 'all'
  );
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedResource, setSelectedResource] = useState(null);

  // Which edit dialog (if any) is open.
  const [dialog, setDialog] = useState(null); // { kind, ...payload }

  // Deep-links from the cover/home pages (?q= / ?cat=) drive the initial view.
  React.useEffect(() => {
    const q = searchParams.get('q');
    const cat = searchParams.get('cat');
    if (q !== null) setSearchQuery(q);
    if (cat) setActiveCategory(cat);
  }, [searchParams]);

  // Debounced search tracking for analytics
  React.useEffect(() => {
    if (!searchQuery.trim() || !user) return;
    const timer = setTimeout(() => {
      history.log(user.id, 'search', searchQuery.trim(), { category: activeCategory });
    }, 1500); // Only log after 1.5 seconds of no typing
    return () => clearTimeout(timer);
  }, [searchQuery, activeCategory, user]);

  const handleResourceClick = (resource) => {
    setSelectedResource(resource);
    if (user) history.log(user.id, 'view', resource.name, { url: resource.url || resource.linkUrl });
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/home');
  };

  const categoriesList = useMemo(
    () =>
      Object.values(catalog)
        .map((c) => ({ slug: c.slug, label: c.title }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [catalog]
  );

  const defaultCategory =
    activeCategory && catalog[activeCategory] ? activeCategory : categoriesList[0]?.slug;

  // ---- admin handlers -----------------------------------------------------
  const onDeleteCard = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    await store.deleteResource(item);
  };
  const onDeleteCategory = async (slug) => {
    const label = catalog[slug]?.title || slug;
    if (!window.confirm(`Delete the "${label}" link and its cards? This cannot be undone.`)) return;
    if (activeCategory === slug) setActiveCategory('all');
    await store.deleteCategory(slug);
  };

  const closeDialog = () => setDialog(null);

  return (
    <div className="app-container">
      <Header theme={theme} toggleTheme={toggleTheme} onHome={() => navigate('/home')} />
      <main className="main-layout">
        <Sidebar
          catalog={catalog}
          sections={sections}
          totalCount={totalCount}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          isAdmin={isAdmin}
          onAddLink={(sectionTitle) => setDialog({ kind: 'category-add', sectionTitle })}
          onEditCategory={(slug) => setDialog({ kind: 'category-edit', slug })}
          onDeleteCategory={onDeleteCategory}
        />
        <section className="content" id="content-area">
          <ResourceGrid
            database={catalog}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onResourceClick={handleResourceClick}
            isAdmin={isAdmin}
            onAddCard={() => setDialog({ kind: 'resource-add' })}
            onEditCard={(item) => setDialog({ kind: 'resource-edit', item })}
            onDeleteCard={onDeleteCard}
            onBack={goBack}
          />
        </section>
      </main>

      <Modal resource={selectedResource} onClose={() => setSelectedResource(null)} database={catalog} />

      {dialog?.kind === 'resource-add' && (
        <ResourceFormModal
          mode="add"
          categories={categoriesList}
          defaultCategory={defaultCategory}
          onSave={(fields, categorySlug) => store.addResource(categorySlug, fields)}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === 'resource-edit' && (
        <ResourceFormModal
          mode="edit"
          initial={dialog.item}
          onSave={(fields) => store.updateResource(dialog.item, fields)}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === 'category-add' && (
        <CategoryFormModal
          mode="add"
          sectionTitle={dialog.sectionTitle}
          onSave={(fields) => store.addCategory(dialog.sectionTitle, fields)}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === 'category-edit' && (
        <CategoryFormModal
          mode="edit"
          initial={{ title: catalog[dialog.slug]?.title || '' }}
          onSave={(fields) => store.updateCategory(dialog.slug, fields)}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}

export default KnowledgeBase;
