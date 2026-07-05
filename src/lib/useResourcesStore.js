// useResourcesStore — the live, admin-editable catalog for the Explore page.
//
// The base catalog is the static src/data/database.js (hundreds of curated
// resources). On top of that we layer admin edits stored in Supabase:
//   • categories table  — new nav links, renamed titles, hidden tombstones
//   • resources  table  — new cards, overrides of static cards, hidden tombstones
//
// A static card has no DB id, so to EDIT or DELETE one we write a DB row that
// carries the original name in `popup_details.__overrides` (for renames) so the
// merge can find and replace/remove the matching static card. New cards are
// plain DB rows; editing them updates by id, deleting them hard-deletes.
//
// Section grouping in the sidebar (e.g. "AI & AUTOMATION") is a presentation-only
// construct with no DB backing, so where a NEW category appears is remembered in
// localStorage on the admin's device.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { database } from '../data/database';
import { resourcesApi, categoriesApi } from './backend';

// Static sidebar grouping — the visual sections and which category slugs sit in
// each. (Moved here from Sidebar so the store owns the whole nav model.)
export const BASE_SECTIONS = [
  { title: 'AI & AUTOMATION', links: ['ai-tools', 'frameworks-agents', 'mcp-tools'] },
  { title: 'DATA & ANALYTICS', links: ['data-analytics', 'web-analytics'] },
  { title: 'BACKEND & INFRA', links: ['backend-infra', 'hosting-domains', 'web-scraping', 'erp-business', 'payments'] },
  { title: 'CLOUD PLATFORMS', links: ['azure', 'aws'] },
  { title: 'FRONTEND & FRAMEWORKS', links: ['web-frameworks'] },
  { title: 'MOBILE', links: ['mobile-frameworks', 'cicd-distribution'] },
  { title: 'DEV TOOLS', links: ['source-control', 'iac'] },
  { title: 'TESTING', links: ['testing'] },
  { title: 'DESIGN & ANIMATION', links: ['design-tools', 'animation', 'colors', 'icons'] },
  { title: 'PRODUCTIVITY', links: ['note-taking', 'task-management'] },
];

const STATIC_LABELS = {
  'ai-tools': 'AI Tools',
  'frameworks-agents': 'Frameworks & Agents',
  'mcp-tools': 'MCP Tools',
  'data-analytics': 'Data & Analytics',
  'web-analytics': 'Web Analytics',
  'backend-infra': 'Backend & Infra',
  'hosting-domains': 'Hosting & Domains',
  'web-scraping': 'Web Scraping',
  'erp-business': 'ERP & Business',
  payments: 'Payments',
  azure: 'Azure',
  aws: 'AWS',
  'web-frameworks': 'Web Frameworks',
  'mobile-frameworks': 'Frameworks',
  'cicd-distribution': 'CI/CD & Distribution',
  'source-control': 'Source Control',
  iac: 'Infrastructure as Code',
  testing: 'Testing',
  'design-tools': 'Design Tools',
  animation: 'Animation',
  colors: 'Colors',
  icons: 'Icons',
  'note-taking': 'Note Taking',
  'task-management': 'Task Management',
};

const STATIC_SLUGS = new Set(BASE_SECTIONS.flatMap((s) => s.links));
const SECTION_MAP_KEY = 'ai-portal:section-map';

function loadSectionMap() {
  try {
    return JSON.parse(localStorage.getItem(SECTION_MAP_KEY) || '{}') || {};
  } catch {
    return {};
  }
}
function saveSectionMap(map) {
  try {
    localStorage.setItem(SECTION_MAP_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Turn a DB resources row into the item shape the UI already understands.
function mapDbResource(row) {
  return {
    name: row.name,
    description: row.description || '',
    url: row.url || '',
    badges: Array.isArray(row.badges) ? row.badges : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    popupDetails: row.popup_details && typeof row.popup_details === 'object' ? row.popup_details : undefined,
    category: row.category_slug,
    _id: row.id,
    _db: true,
  };
}

// Build the merged catalog (same shape as the static `database`, keyed by slug,
// each value = { title, sectionTitle, slug, items:[...] }). Items carry _id /
// _overridesStatic so CRUD knows how to persist a change.
function buildCatalog(dbCategories, dbResources) {
  const catalog = {};

  // 1. Start from the static catalog (deep-ish clone so we never mutate source).
  for (const slug of Object.keys(database)) {
    const src = database[slug] || {};
    catalog[slug] = {
      title: src.title || STATIC_LABELS[slug] || slug,
      sectionTitle: src.sectionTitle || src.title || slug,
      slug,
      items: (src.items || []).map((it) => ({ ...it, category: slug, _static: true })),
    };
  }

  // 2. Apply category rows: rename / hide existing, add custom ones.
  for (const c of dbCategories) {
    if (catalog[c.slug]) {
      catalog[c.slug]._catId = c.id;
      if (c.hidden) catalog[c.slug]._hidden = true;
      else if (c.title) {
        catalog[c.slug].title = c.title;
        catalog[c.slug].sectionTitle = c.title;
      }
    } else if (!c.hidden) {
      catalog[c.slug] = {
        title: c.title || c.slug,
        sectionTitle: c.title || c.slug,
        slug: c.slug,
        items: [],
        _catId: c.id,
        _custom: true,
      };
    }
  }

  // 3. Apply resource rows: override / hide static cards, add new ones.
  for (const r of dbResources) {
    const bucket = catalog[r.category_slug];
    if (!bucket || bucket._hidden) continue; // orphan / hidden category -> skip
    const matchName = (r.popup_details && r.popup_details.__overrides) || r.name;
    const idx = bucket.items.findIndex((it) => it.name === matchName);
    if (idx >= 0) {
      if (r.hidden) {
        bucket.items.splice(idx, 1); // tombstone removes the static card
      } else {
        bucket.items[idx] = { ...bucket.items[idx], ...mapDbResource(r), _overridesStatic: true };
      }
    } else if (!r.hidden) {
      bucket.items.push(mapDbResource(r));
    }
  }

  // 4. Drop hidden categories entirely.
  for (const slug of Object.keys(catalog)) {
    if (catalog[slug]._hidden) delete catalog[slug];
  }

  return catalog;
}

export function useResourcesStore() {
  const [dbCategories, setDbCategories] = useState([]);
  const [dbResources, setDbResources] = useState([]);
  const [sectionMap, setSectionMap] = useState(loadSectionMap);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const [cats, res] = await Promise.all([categoriesApi.list(), resourcesApi.list()]);
    if (cats.error || res.error) {
      setError(cats.error || res.error);
    } else {
      setError(null);
    }
    setDbCategories(cats.data || []);
    setDbResources(res.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const catalog = useMemo(() => buildCatalog(dbCategories, dbResources), [dbCategories, dbResources]);

  // Sidebar model: static sections (with live titles/counts) + custom categories
  // grouped by their remembered section.
  const sections = useMemo(() => {
    const result = BASE_SECTIONS.map((sec) => ({
      title: sec.title,
      links: sec.links
        .filter((slug) => catalog[slug])
        .map((slug) => ({ slug, label: catalog[slug].title, count: catalog[slug].items.length })),
    }));

    const customSlugs = Object.keys(catalog).filter((slug) => !STATIC_SLUGS.has(slug));
    for (const slug of customSlugs) {
      const secTitle = sectionMap[slug] || 'CUSTOM';
      let sec = result.find((r) => r.title === secTitle);
      if (!sec) {
        sec = { title: secTitle, links: [] };
        result.push(sec);
      }
      sec.links.push({ slug, label: catalog[slug].title, count: catalog[slug].items.length, custom: true });
    }
    return result;
  }, [catalog, sectionMap]);

  const totalCount = useMemo(
    () => Object.values(catalog).reduce((acc, c) => acc + (c.items?.length || 0), 0),
    [catalog]
  );

  // ---- resource CRUD ------------------------------------------------------
  const addResource = useCallback(
    async (categorySlug, fields) => {
      const { error: e } = await resourcesApi.insert({
        name: fields.name,
        category_slug: categorySlug,
        description: fields.description || '',
        url: fields.url || '',
        badges: fields.badges || [],
        tags: fields.tags || [],
      });
      if (e) return { error: e };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const updateResource = useCallback(
    async (item, fields) => {
      const patch = {
        name: fields.name,
        description: fields.description || '',
        url: fields.url || '',
        badges: fields.badges || [],
        tags: fields.tags || [],
        updated_at: new Date().toISOString(),
      };
      let e = null;
      if (item._id) {
        ({ error: e } = await resourcesApi.update(item._id, patch));
      } else {
        // First edit of a static card -> create an override row that remembers
        // the original name so the merge can replace it (even after a rename).
        const popup_details = { ...(item.popupDetails || {}), __overrides: item.name };
        ({ error: e } = await resourcesApi.insert({
          ...patch,
          category_slug: item.category,
          popup_details,
        }));
      }
      if (e) return { error: e };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const deleteResource = useCallback(
    async (item) => {
      let e = null;
      if (item._id) {
        if (item._overridesStatic) {
          ({ error: e } = await resourcesApi.update(item._id, { hidden: true }));
        } else {
          ({ error: e } = await resourcesApi.remove(item._id));
        }
      } else {
        // Pure static card -> write a tombstone keyed by its name.
        ({ error: e } = await resourcesApi.insert({
          name: item.name,
          category_slug: item.category,
          hidden: true,
        }));
      }
      if (e) return { error: e };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  // ---- category CRUD ------------------------------------------------------
  const addCategory = useCallback(
    async (sectionTitle, fields) => {
      let slug = slugify(fields.title);
      if (!slug) return { error: { message: 'Please enter a name.' } };
      let n = 2;
      while (catalog[slug]) slug = `${slugify(fields.title)}-${n++}`;
      const { error: e } = await categoriesApi.insert({ slug, title: fields.title });
      if (e) return { error: e };
      const nextMap = { ...sectionMap, [slug]: sectionTitle };
      setSectionMap(nextMap);
      saveSectionMap(nextMap);
      await refresh();
      return { error: null, slug };
    },
    [catalog, sectionMap, refresh]
  );

  const updateCategory = useCallback(
    async (slug, fields) => {
      const cat = catalog[slug];
      let e = null;
      if (cat?._catId) ({ error: e } = await categoriesApi.update(cat._catId, { title: fields.title }));
      else ({ error: e } = await categoriesApi.insert({ slug, title: fields.title }));
      if (e) return { error: e };
      await refresh();
      return { error: null };
    },
    [catalog, refresh]
  );

  const deleteCategory = useCallback(
    async (slug) => {
      const cat = catalog[slug];
      const isStatic = STATIC_SLUGS.has(slug);
      let e = null;
      if (isStatic) {
        if (cat?._catId) ({ error: e } = await categoriesApi.update(cat._catId, { hidden: true }));
        else ({ error: e } = await categoriesApi.insert({ slug, hidden: true }));
      } else if (cat?._catId) {
        ({ error: e } = await categoriesApi.remove(cat._catId));
        // Clean up its resources so they don't linger as orphans.
        await resourcesApi.removeWhere((r) => r.category_slug === slug, 'category_slug', slug);
      }
      if (e) return { error: e };
      if (sectionMap[slug]) {
        const nextMap = { ...sectionMap };
        delete nextMap[slug];
        setSectionMap(nextMap);
        saveSectionMap(nextMap);
      }
      await refresh();
      return { error: null };
    },
    [catalog, sectionMap, refresh]
  );

  return {
    catalog,
    sections,
    totalCount,
    loading,
    error,
    refresh,
    addResource,
    updateResource,
    deleteResource,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
