export function siteUrl(path = ''): string {
    const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '');
    const origin = configuredSiteUrl ?? window.location.origin;
    const normalizedPath = path === '' ? '' : path.startsWith('/') ? path : `/${path}`;

    return `${origin}${normalizedPath}`;
}
