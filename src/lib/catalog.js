// Catalog helpers — derive views (featured, popular, recent, category previews)
// from the existing static src/data/database.js without modifying it.

import { database } from '../data/database';

export const categoryMeta = {
  'ai-tools': { label: 'AI Tools', icon: 'Sparkles' },
  'frameworks-agents': { label: 'Frameworks & Agents', icon: 'Boxes' },
  'mcp-tools': { label: 'MCP Tools', icon: 'Plug' },
  'data-analytics': { label: 'Data & Analytics', icon: 'BarChart3' },
  'web-analytics': { label: 'Web Analytics', icon: 'LineChart' },
  'backend-infra': { label: 'Backend & Infra', icon: 'Server' },
  'hosting-domains': { label: 'Hosting & Domains', icon: 'Globe' },
  'web-scraping': { label: 'Web Scraping', icon: 'Bug' },
  'erp-business': { label: 'ERP & Business', icon: 'Building2' },
  payments: { label: 'Payments', icon: 'CreditCard' },
  azure: { label: 'Azure', icon: 'Cloud' },
  aws: { label: 'AWS', icon: 'Cloud' },
  'mobile-frameworks': { label: 'Mobile Frameworks', icon: 'Smartphone' },
  'cicd-distribution': { label: 'CI/CD & Distribution', icon: 'GitBranch' },
  'source-control': { label: 'Source Control', icon: 'GitMerge' },
  iac: { label: 'Infrastructure as Code', icon: 'FileCode' },
  testing: { label: 'Testing', icon: 'FlaskConical' },
  'design-tools': { label: 'Design Tools', icon: 'PenTool' },
  animation: { label: 'Animation', icon: 'Film' },
  colors: { label: 'Colors', icon: 'Palette' },
  icons: { label: 'Icons', icon: 'Shapes' },
  'note-taking': { label: 'Note Taking', icon: 'NotebookPen' },
  'task-management': { label: 'Task Management', icon: 'ListChecks' },
  'web-frameworks': { label: 'Web Frameworks', icon: 'LayoutTemplate' },
};

export function allResources() {
  const out = [];
  for (const key of Object.keys(database)) {
    for (const item of database[key]?.items || []) {
      out.push({ ...item, category: key });
    }
  }
  return out;
}

export function categoryList() {
  return Object.keys(database).map((slug) => ({
    slug,
    label: categoryMeta[slug]?.label || database[slug]?.title || slug,
    icon: categoryMeta[slug]?.icon || 'Folder',
    count: database[slug]?.items?.length || 0,
  }));
}

export function totalResourceCount() {
  return allResources().length;
}

// "Featured" = resources flagged NEW; falls back to first N.
export function featuredResources(n = 6) {
  const all = allResources();
  const flagged = all.filter((r) => (r.badges || []).includes('NEW'));
  return (flagged.length ? flagged : all).slice(0, n);
}

// Deterministic "popular" pick (no Math.random): spread across catalog.
export function popularResources(n = 8) {
  const all = allResources();
  const step = Math.max(1, Math.floor(all.length / n));
  const out = [];
  for (let i = 0; i < all.length && out.length < n; i += step) out.push(all[i]);
  return out;
}

// "Recently added" = tail of the catalog (newest appended last in data file).
export function recentResources(n = 8) {
  const all = allResources();
  return all.slice(Math.max(0, all.length - n)).reverse();
}

// "Trending" = resources with the most tags/badges as a lightweight proxy.
export function trendingResources(n = 6) {
  return [...allResources()]
    .sort((a, b) => (b.badges?.length || 0) + (b.tags?.length || 0) - ((a.badges?.length || 0) + (a.tags?.length || 0)))
    .slice(0, n);
}

export function findResource(name) {
  return allResources().find((r) => r.name === name) || null;
}
