const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');

export function apiUrl(path: string): string {
    if (/^https?:\/\//.test(path)) {
        return path;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return configuredApiUrl ? `${configuredApiUrl}${normalizedPath}` : normalizedPath;
}
