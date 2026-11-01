/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  experimental: { serverActions: { bodySizeLimit: '25mb' } },
  poweredByHeader: false,
  devIndicators: false,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Static preview build (GitHub Pages): served under /<repo>/ with folder-style URLs.
  ...(process.env.NEXT_PUBLIC_BASE_PATH ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH } : {}),
  ...(process.env.NEXT_PUBLIC_STATIC_PREVIEW === '1' ? { trailingSlash: true } : {}),
};
export default nextConfig;
