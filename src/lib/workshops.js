// Workshop certificates.
//
// A "workshop" certificate is a higher-order award earned by completing an
// ENTIRE category of quizzes — not a single resource. The flagship one is the
// "AI & Emerging Technologies" workshop: a student earns it once they have
// scored >= WORKSHOP_PASS_PERCENT (70%) on EVERY tool in the AI Tools category.
//
// Storage: rather than a new table, a workshop award is persisted as a single
// sentinel row in `quiz_attempts` whose `resource_name` is the workshop's
// resourceName. It carries `cert_status` ('pending' | 'approved' | 'rejected')
// exactly like a normal certificate, so it flows through the existing admin
// approval pipeline. Every view that lists real quiz results / leaderboard
// scores filters these sentinel rows out via isWorkshopResource().

import { allResources } from './catalog';

export const WORKSHOP_PASS_PERCENT = 70;

export const WORKSHOPS = [
  {
    slug: 'ai-emerging-tech',
    categorySlug: 'ai-tools',
    // This exact string is the sentinel quiz_attempts.resource_name.
    resourceName: 'AI & Emerging Technologies Workshop',
    // Certificate copy (mirrors the printed template).
    heading: 'has successfully completed the Workshop on',
    title: 'Artificial Intelligence and Emerging Technologies',
    dedication: 'Dedicated to Continuous learning and innovation',
    tagline: 'Learning Today, Innovating Tomorrow',
  },
];

const _byResource = new Map(WORKSHOPS.map((w) => [w.resourceName, w]));

export function isWorkshopResource(resourceName) {
  return _byResource.has(resourceName);
}

export function workshopFor(resourceName) {
  return _byResource.get(resourceName) || null;
}

// Names of every resource currently in a workshop's category. Pass an explicit
// `resources` list (e.g. the reactive merged catalog from useResourcesStore) for
// correctness during load; otherwise it reads the shared catalog overlay. Either
// way, admin-added AI tools automatically become part of what's required.
export function workshopResourceNames(workshop, resources) {
  return (resources || allResources())
    .filter((r) => r.category === workshop.categorySlug)
    .map((r) => r.name);
}

// Compute a user's progress toward a workshop from their raw quiz attempts.
// Returns { completed, passedCount, total, missing[], avgPercentage }.
export function workshopProgress(workshop, attempts, requiredNames) {
  const required = requiredNames || workshopResourceNames(workshop);
  const bestByResource = {};
  for (const a of attempts || []) {
    if (!required.includes(a.resource_name)) continue;
    const pct = Number(a.percentage) || 0;
    if (bestByResource[a.resource_name] === undefined || pct > bestByResource[a.resource_name]) {
      bestByResource[a.resource_name] = pct;
    }
  }
  const passedNames = required.filter((n) => (bestByResource[n] ?? -1) >= WORKSHOP_PASS_PERCENT);
  const missing = required.filter((n) => (bestByResource[n] ?? -1) < WORKSHOP_PASS_PERCENT);
  const total = required.length;
  const passedCount = passedNames.length;
  const avgPercentage = passedCount
    ? Math.round(passedNames.reduce((s, n) => s + bestByResource[n], 0) / passedCount)
    : 0;
  return {
    completed: total > 0 && passedCount === total,
    passedCount,
    total,
    missing,
    avgPercentage,
  };
}

// The sentinel quiz_attempts row (if any) that carries this workshop's approval
// status for the user. `attempts` is the user's raw attempts list.
export function workshopAttempt(workshop, attempts) {
  return (attempts || []).find((a) => a.resource_name === workshop.resourceName) || null;
}
