// Module completion certificates.
//
// A "module certificate" is a higher-order award earned by completing an ENTIRE
// module (a catalog category) — passing every tool's quiz in it at
// MODULE_PASS_PERCENT (70%) or higher. Each module (AI Tools, Data & Analytics,
// …) has its own certificate. The AI Tools module has bespoke wording (the
// "Artificial Intelligence and Emerging Technologies" workshop); every other
// module uses generic module-completion wording built from its title.
//
// Storage: an award is persisted as a single sentinel row in `quiz_attempts`
// whose resource_name is `module-cert:<categorySlug>`. It carries `cert_status`
// ('pending' | 'approved' | 'rejected') exactly like a normal certificate, so it
// flows through the existing admin approval pipeline. Every view that lists real
// quiz results / leaderboard scores filters these sentinel rows out via
// isModuleCertResource().

import { allResources, categoryMeta } from './catalog';
import { sectionSlug, isSectionSlug, sectionTitleFromSlug } from './sections';

// Section helpers are re-exported so callers can import all certificate-award
// concerns from this one module.
export { sectionSlug, isSectionSlug, sectionTitleFromSlug };

export const MODULE_PASS_PERCENT = 70;

const MODULE_CERT_PREFIX = 'module-cert:';
// Older sentinel value(s) from before module certs were generalized — still
// treated as module-cert rows so they never leak into quiz results.
const LEGACY_SENTINELS = new Set(['AI & Emerging Technologies Workshop']);

// Per-award certificate copy, keyed by slug. Awards are now earned per
// nav-section (slug `sec-…`); anything not listed here falls back to generic
// wording derived from the section/module title. The legacy `ai-tools` entry is
// kept so any pre-existing per-module award rows still render their original
// wording, and the `sec-ai-automation` entry preserves that flagship workshop
// copy for the "AI & AUTOMATION" section it now belongs to.
const MODULE_META = {
  'ai-tools': {
    title: 'Artificial Intelligence and Emerging Technologies',
    heading: 'has successfully completed the Workshop on',
    dedication: 'Dedicated to Continuous learning and innovation',
    tagline: 'Learning Today, Innovating Tomorrow',
  },
  'sec-ai-automation': {
    title: 'Artificial Intelligence and Emerging Technologies',
    heading: 'has successfully completed the Workshop on',
    dedication: 'Dedicated to Continuous learning and innovation',
    tagline: 'Learning Today, Innovating Tomorrow',
  },
};

export function isModuleCertResource(name) {
  return typeof name === 'string' && (name.startsWith(MODULE_CERT_PREFIX) || LEGACY_SENTINELS.has(name));
}

export function moduleCertResourceName(slug) {
  return `${MODULE_CERT_PREFIX}${slug}`;
}

export function moduleCertSlug(name) {
  return typeof name === 'string' && name.startsWith(MODULE_CERT_PREFIX)
    ? name.slice(MODULE_CERT_PREFIX.length)
    : null;
}

// A readable module label for a slug. Callers that hold the live catalog should
// pass its title; this static fallback covers built-in categories and
// title-cases unknown (admin-created) slugs.
export function moduleLabel(slug) {
  if (isSectionSlug(slug)) return sectionTitleFromSlug(slug);
  if (categoryMeta[slug]?.label) return categoryMeta[slug].label;
  return String(slug || '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Display + certificate copy for a module. `label` is the current category
// title (pass the live one when available).
export function moduleCertMeta(slug, label) {
  const resolvedLabel = label || moduleLabel(slug);
  const base = MODULE_META[slug] || {
    title: resolvedLabel,
    heading: 'has successfully completed every module in',
    dedication: 'Dedicated to Continuous learning and innovation',
    tagline: 'Learning Today, Innovating Tomorrow',
  };
  return {
    slug,
    categorySlug: slug,
    resourceName: moduleCertResourceName(slug),
    label: resolvedLabel,
    ...base,
  };
}

// Names of every resource in a module. Pass an explicit `resources` list (e.g.
// the reactive merged catalog) for correctness during load; otherwise reads the
// shared catalog overlay. Either way, admin-added tools count automatically.
export function moduleResourceNames(slug, resources) {
  return (resources || allResources())
    .filter((r) => r.category === slug)
    .map((r) => r.name);
}

// A user's progress toward a module certificate from their raw quiz attempts.
// Returns { completed, passedCount, total, missing[] }.
export function moduleProgress(slug, attempts, requiredNames) {
  const required = requiredNames || moduleResourceNames(slug);
  const best = {};
  for (const a of attempts || []) {
    if (!required.includes(a.resource_name)) continue;
    const pct = Number(a.percentage) || 0;
    if (best[a.resource_name] === undefined || pct > best[a.resource_name]) best[a.resource_name] = pct;
  }
  const passed = required.filter((n) => (best[n] ?? -1) >= MODULE_PASS_PERCENT);
  const missing = required.filter((n) => (best[n] ?? -1) < MODULE_PASS_PERCENT);
  const total = required.length;
  return {
    completed: total > 0 && passed.length === total,
    passedCount: passed.length,
    total,
    missing,
  };
}

// The sentinel quiz_attempts row (if any) carrying this module cert's approval
// status for the user.
export function moduleCertAttempt(slug, attempts) {
  const rn = moduleCertResourceName(slug);
  return (attempts || []).find((a) => a.resource_name === rn) || null;
}

// A user's progress toward a SECTION certificate — the higher-order award that
// unlocks only once EVERY module inside a nav-section is completed. It is just
// module progress evaluated against the union of every resource across all of
// the section's modules, so `completed` is true only when all of them are
// passed at MODULE_PASS_PERCENT. `requiredNames` is that combined resource list
// (built from the live catalog by the caller), which keeps this automatically
// correct as modules/resources are added to a section.
export function sectionProgress(requiredNames, attempts) {
  return moduleProgress(null, attempts, requiredNames || []);
}
