// Nav-section model — the "nav-section-title" groupings shown in the sidebar
// (e.g. "AI & AUTOMATION"). This is the single source of truth for which
// category slugs (modules) belong to which section.
//
// Certificates are awarded PER SECTION (see workshops.js / CertificatesPage):
// one certificate is earned only once EVERY module inside a section is
// completed. Because that logic is derived entirely from this grouping plus the
// live catalog, adding a new nav-section-title here — or adding new modules /
// resources to an existing one — automatically extends certificate generation
// with no further code changes.

// Static sidebar grouping — the visual sections and which category slugs sit in
// each. (Owned here so both the resource store and the certificate logic can
// read the same nav model without pulling in React.)
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

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Stable identifier for a nav-section, namespaced with a `sec-` prefix so it can
// never collide with a category slug (e.g. the "DATA & ANALYTICS" section →
// `sec-data-analytics`, distinct from the `data-analytics` category).
const SECTION_SLUG_PREFIX = 'sec-';

export function sectionSlug(title) {
  return `${SECTION_SLUG_PREFIX}${slugify(title)}`;
}

export function isSectionSlug(slug) {
  return typeof slug === 'string' && slug.startsWith(SECTION_SLUG_PREFIX);
}

// Reverse a section slug back to a human title. Static sections round-trip
// exactly; custom (admin-created) sections fall back to a title-cased slug.
const TITLE_BY_SLUG = Object.fromEntries(BASE_SECTIONS.map((s) => [sectionSlug(s.title), s.title]));

export function sectionTitleFromSlug(slug) {
  if (TITLE_BY_SLUG[slug]) return TITLE_BY_SLUG[slug];
  return String(slug || '')
    .replace(new RegExp(`^${SECTION_SLUG_PREFIX}`), '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
