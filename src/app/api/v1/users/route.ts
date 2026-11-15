import apiRoute from '@/server/api/apiRoute';
import readJson from '@/server/api/readJson';
import getRequestContext from '@/server/auth/getRequestContext';
import UserService from '@/server/user/UserService';

export const GET = apiRoute(async (request) => ({items: await new UserService().list(await getRequestContext(request))}));

export const POST = apiRoute(async (request) => {
    const user = await new UserService().create(await getRequestContext(request), await readJson(request));
    return Response.json(user, {status: 201});
});
