export function getSiteUrl(): URL | null {
  const configuredSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL;
  if (!configuredSiteUrl) return null;
  try {
    const url = new URL(configuredSiteUrl);
    const loopback = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    const protocolAllowed = url.protocol === 'https:' || (import.meta.env.MODE !== 'production' && loopback && url.protocol === 'http:');
    if (!protocolAllowed || url.username || url.password || url.search || url.hash) return null;
    return new URL(`${url.origin}${url.pathname.replace(/\/$/, '')}/`);
  } catch {
    return null;
  }
}

export function buildSiteUrl(pathname: string): string | null {
  const siteUrl = getSiteUrl();
  if (!siteUrl || !pathname.startsWith('/')) return null;
  return new URL(pathname, siteUrl).href;
}