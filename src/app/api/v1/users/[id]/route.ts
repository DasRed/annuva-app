import apiRoute from '@/server/api/apiRoute';
import readJson from '@/server/api/readJson';
import getRequestContext from '@/server/auth/getRequestContext';
import UserService from '@/server/user/UserService';

export const PATCH = apiRoute<{ id: string }>(async (request, {id}) => new UserService().update(await getRequestContext(request), id, await readJson(request)));

export const DELETE = apiRoute<{ id: string }>(async (request, {id}) => {
    await new UserService().remove(await getRequestContext(request), id);
    return new Response(null, {status: 204});
});
