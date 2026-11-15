import getConfig from '@/server/config/getConfig';

/**
 * Public base URL of the instance. The app is domain-agnostic: it derives the URL from the request
 * (honouring X-Forwarded-* behind a reverse proxy); APP_URL is only needed without a request.
 */
export default function getBaseUrl(headers?: Headers): string {
    const configured = getConfig().appUrl;
    if (headers === undefined) {
        return configured ?? 'http://localhost:40100';
    }
    const host = headers.get('x-forwarded-host')?.split(',')[0]?.trim() ?? headers.get('host');
    if (host === null || host === undefined || host === '') {
        return configured ?? 'http://localhost:40100';
    }
    const proto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
    return `${proto}://${host}`;
}
