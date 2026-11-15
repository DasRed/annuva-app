import apiRoute from '@/server/api/apiRoute';
import readJson from '@/server/api/readJson';
import getRequestContext from '@/server/auth/getRequestContext';
import TokenService from '@/server/token/TokenService';

export const GET = apiRoute(async (request) => ({items: await new TokenService().list(await getRequestContext(request))}));

export const POST = apiRoute(async (request) => {
    const token = await new TokenService().create(await getRequestContext(request), await readJson(request));
    return Response.json(token, {status: 201});
});
