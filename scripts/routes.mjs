// Shared list of every static route in the app — used by both the sitemap
// generator and the prerender script, so they can't drift out of sync.
// Keep this in sync with the <Route> entries in src/App.tsx.
export const STATIC_ROUTES = [
  '/',
  '/about',
  '/how-it-works',
  '/for-ci',
  '/for-generators',
  '/faq',
  '/contact',
  '/privacy-terms',
  '/things-to-know',
  '/regulatory-guide',
  '/glossary',
  '/savings-calculator',
  '/renewablesGenerator',
  '/ciBuyer',
  '/blog',
];
