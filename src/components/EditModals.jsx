// Admin edit dialogs for the Explore catalog: add/edit a resource card and
// add/edit a category (nav link). Both reuse the portal's modal chrome.

import React, { useEffect, useState } from 'react';

function useEscToClose(onClose) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
}

function toCsv(arr) {
  return Array.isArray(arr) ? arr.join(', ') : '';
}
function fromCsv(str) {
  return String(str || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Resource card add/edit
// ---------------------------------------------------------------------------
export function ResourceFormModal({ mode, initial, categories, defaultCategory, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [url, setUrl] = useState(initial?.url || '');
  const [tags, setTags] = useState(toCsv(initial?.tags));
  const [badges, setBadges] = useState(toCsv(initial?.badges));
  const [categorySlug, setCategorySlug] = useState(
    initial?.category || defaultCategory || (categories?.[0]?.slug ?? '')
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEscToClose(onClose);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErr('Name is required.');
      return;
    }
    setSaving(true);
    setErr('');
    const fields = {
      name: name.trim(),
      description: description.trim(),
      url: url.trim(),
      tags: fromCsv(tags),
      badges: fromCsv(badges),
    };
    const res = await onSave(fields, categorySlug);
    setSaving(false);
    if (res?.error) setErr(res.error.message || 'Could not save. Check your admin access.');
    else onClose();
  };

  return (
    <div className="modal-overlay" style={{ display: 'grid' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel edit-modal">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="edit-modal-title">{mode === 'edit' ? 'Edit resource' : 'Add resource'}</h2>
        <form onSubmit={submit} className="edit-form">
          <label className="form-field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Cursor" />
          </label>

          {mode !== 'edit' && categories?.length > 0 && (
            <label className="form-field">
              <span>Category</span>
              <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </label>
          )}

          <label className="form-field">
            <span>Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Short summary of the tool" />
          </label>
          <label className="form-field">
            <span>Link URL</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </label>
          <label className="form-field">
            <span>Tags <em>(comma separated)</em></span>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="AI Tools, Editor" />
          </label>
          <label className="form-field">
            <span>Badges <em>(comma separated)</em></span>
            <input value={badges} onChange={(e) => setBadges(e.target.value)} placeholder="NEW" />
          </label>

          {err && <p className="form-error">{err}</p>}
          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-solid" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category (nav link) add/edit
// ---------------------------------------------------------------------------
export function CategoryFormModal({ mode, initial, sectionTitle, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEscToClose(onClose);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErr('Name is required.');
      return;
    }
    setSaving(true);
    setErr('');
    const res = await onSave({ title: title.trim() });
    setSaving(false);
    if (res?.error) setErr(res.error.message || 'Could not save. Check your admin access.');
    else onClose();
  };

  return (
    <div className="modal-overlay" style={{ display: 'grid' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel edit-modal">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="edit-modal-title">{mode === 'edit' ? 'Rename link' : 'Add link'}</h2>
        {sectionTitle && mode !== 'edit' && (
          <p className="edit-modal-sub">In section <strong>{sectionTitle}</strong></p>
        )}
        <form onSubmit={submit} className="edit-form">
          <label className="form-field">
            <span>Name</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="e.g. Vector Databases" />
          </label>
          {err && <p className="form-error">{err}</p>}
          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-solid" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
