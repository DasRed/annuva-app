import apiRoute from '@/server/api/apiRoute';
import sessionCookieHeader from '@/server/api/sessionCookieHeader';
import deleteSession from '@/server/auth/deleteSession';
import readCookie from '@/server/auth/readCookie';
import sessionCookie from '@/server/auth/sessionCookie';

export const POST = apiRoute(async (request) => {
    await deleteSession(readCookie(request.headers.get('cookie'), sessionCookie.name));
    return Response.json({ok: true}, {headers: {'Set-Cookie': sessionCookieHeader(request, null)}});
});
