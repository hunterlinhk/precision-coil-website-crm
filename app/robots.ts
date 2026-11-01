import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

// Search and AI crawlers are welcome on the public site; admin and APIs stay private.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/HunterLin', '/api/'] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
