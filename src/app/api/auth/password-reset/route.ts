import apiRoute from '@/server/api/apiRoute';
import readJson from '@/server/api/readJson';
import AuthService from '@/server/auth/AuthService';
import getBaseUrl from '@/server/http/getBaseUrl';

/**
 * POST {email} requests a reset link, POST {token, password} sets the new password.
 */
export const POST = apiRoute(async (request) => {
    const body = await readJson(request) as Record<string, unknown>;
    if (typeof body.token === 'string') {
        await new AuthService().resetPassword(body);
    }
    else {
        await new AuthService().requestPasswordReset(body, getBaseUrl(request.headers));
    }
    return {ok: true};
});
