import sessionCookie from '@/server/auth/sessionCookie';

/**
 * Set-Cookie header for the session. `secure` is set when the request came in via HTTPS.
 */
export default function sessionCookieHeader(request: Request, token: string | null, expiresAt?: Date): string {
    const forwarded = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const secure = (forwarded ?? new URL(request.url).protocol.replace(':', '')) === 'https';
    const parts = [
        `${sessionCookie.name}=${token === null ? '' : encodeURIComponent(token)}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        token === null ? 'Max-Age=0' : `Expires=${expiresAt?.toUTCString()}`,
    ];
    if (secure) {
        parts.push('Secure');
    }
    return parts.join('; ');
}
