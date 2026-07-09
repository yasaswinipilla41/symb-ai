// Minimal server copy of the module-certificate wording from
// src/lib/workshops.js (moduleCertMeta). Kept tiny and dependency-free so the
// serverless function does not import the client catalog/database modules.

const MODULE_CERT_PREFIX = 'module-cert:';

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

export function isModuleResourceName(name) {
  return typeof name === 'string' && name.startsWith(MODULE_CERT_PREFIX);
}

export function moduleSlugFromName(name) {
  return typeof name === 'string' && name.startsWith(MODULE_CERT_PREFIX)
    ? name.slice(MODULE_CERT_PREFIX.length)
    : null;
}

// `label` is the current human module title, passed from the client (which has
// the live catalog). Falls back to a title-cased slug.
export function moduleMetaFor(slug, label) {
  const resolvedLabel = label || String(slug || '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const base = MODULE_META[slug] || {
    title: resolvedLabel,
    heading: 'has successfully completed every module in',
    dedication: 'Dedicated to Continuous learning and innovation',
    tagline: 'Learning Today, Innovating Tomorrow',
  };
  return { slug, label: resolvedLabel, ...base };
}
