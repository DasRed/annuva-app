import apiRoute from '@/server/api/apiRoute';
import clientMeta from '@/server/api/clientMeta';
import readJson from '@/server/api/readJson';
import sessionCookieHeader from '@/server/api/sessionCookieHeader';
import createSession from '@/server/auth/createSession';
import SetupService from '@/server/setup/SetupService';

export const dynamic = 'force-dynamic';

export const GET = apiRoute(() => new SetupService().status());

/**
 * POST {action: "verify", token} checks the setup token, POST {action: "complete", …} finishes the
 * setup and logs the new admin in.
 */
export const POST = apiRoute(async (request) => {
    const body = await readJson(request) as Record<string, unknown>;
    const service = new SetupService();
    if (body.action === 'verify') {
        await service.verifyToken(body.token);
        return {ok: true};
    }
    const {action: _action, ...input} = body;
    const user = await service.complete(input);
    const meta = clientMeta(request);
    const {expiresAt, token} = await createSession(user.id, meta.userAgent, meta.ip);
    return Response.json({user}, {headers: {'Set-Cookie': sessionCookieHeader(request, token, expiresAt)}});
});
