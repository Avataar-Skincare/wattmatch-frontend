import { Head } from 'vite-react-ssg';

const SITE_NAME = 'Wattmatch';
const SITE_URL = 'https://www.wattmatch.in';
const DEFAULT_IMAGE = 'https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/watt-favicon.png';

// Wraps vite-react-ssg's <Head>: it correctly overrides duplicate tags
// (later/nested usage wins), so each page's Seo cleanly replaces any
// higher-level default without leaking duplicate <title>/<meta> tags.
export default function Seo({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  type = 'website',
  publishedTime,
  structuredData,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  structuredData?: object;
}) {
  const url = `${SITE_URL}${path}`;
  const fullTitle = `${title} | ${SITE_NAME}`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Head>
  );
}
