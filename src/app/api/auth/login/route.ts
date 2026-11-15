import apiRoute from '@/server/api/apiRoute';
import clientMeta from '@/server/api/clientMeta';
import readJson from '@/server/api/readJson';
import sessionCookieHeader from '@/server/api/sessionCookieHeader';
import AuthService from '@/server/auth/AuthService';
import toPublicUser from '@/server/user/toPublicUser';

export const POST = apiRoute(async (request) => {
    const result = await new AuthService().login(await readJson(request), clientMeta(request));
    if (result.twoFactorRequired) {
        return {challenge: result.challenge, twoFactorRequired: true};
    }
    return Response.json({twoFactorRequired: false, user: toPublicUser(result.user)}, {headers: {'Set-Cookie': sessionCookieHeader(request, result.token, result.expiresAt)}});
});
