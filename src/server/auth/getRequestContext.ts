import authenticateBearer from '@/server/auth/authenticateBearer';
import type AuthContext from '@/server/auth/AuthContext';
import contextFromUser from '@/server/auth/contextFromUser';
import findSessionUser from '@/server/auth/findSessionUser';
import readCookie from '@/server/auth/readCookie';
import sessionCookie from '@/server/auth/sessionCookie';
import ApiError from '@/server/error/ApiError';

/**
 * Authenticates an API request: a bearer token (API clients, MCP) or the session cookie (UI).
 */
export default async function getRequestContext(request: Request, via: 'api' | 'mcp' = 'api'): Promise<AuthContext> {
    const authorization = request.headers.get('authorization');
    if (authorization !== null && /^bearer\s+/i.test(authorization)) {
        const result = await authenticateBearer(authorization.replace(/^bearer\s+/i, '').trim());
        if (result === null) {
            throw ApiError.unauthorized('Invalid or expired token.');
        }
        return contextFromUser(result.user, result.scope, via);
    }
    const user = await findSessionUser(readCookie(request.headers.get('cookie'), sessionCookie.name));
    if (user === null) {
        throw ApiError.unauthorized();
    }
    return contextFromUser(user, 'read_write', via === 'mcp' ? 'mcp' : 'ui');
}
