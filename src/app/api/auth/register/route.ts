import apiRoute from '@/server/api/apiRoute';
import clientMeta from '@/server/api/clientMeta';
import readJson from '@/server/api/readJson';
import sessionCookieHeader from '@/server/api/sessionCookieHeader';
import AuthService from '@/server/auth/AuthService';
import toPublicUser from '@/server/user/toPublicUser';

export const POST = apiRoute(async (request) => {
    const {expiresAt, token, user} = await new AuthService().register(await readJson(request), clientMeta(request));
    return Response.json({user: toPublicUser(user)}, {headers: {'Set-Cookie': sessionCookieHeader(request, token, expiresAt)}});
});
