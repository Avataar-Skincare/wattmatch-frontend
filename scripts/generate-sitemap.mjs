// Regenerates public/sitemap.xml from the static route list below plus
// whatever posts exist in src/data/blogPosts.ts. Runs automatically as part
// of `npm run build`, so publishing a new blog post and rebuilding is enough
// to keep the sitemap current — no manual editing needed.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { STATIC_ROUTES } from './routes.mjs';

const SITE_URL = 'https://wattmatch.in';

const { blogPosts } = await import('../src/data/blogPosts.ts');

const urls = [
  ...STATIC_ROUTES,
  ...blogPosts.map((post) => `/blog/${post.slug}`),
];

const body = urls
  .map((route) => `  <url>\n    <loc>${SITE_URL}${route}</loc>\n  </url>`)
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sitemap.xml');
writeFileSync(outPath, xml);
console.log(`sitemap.xml written with ${urls.length} URLs`);
