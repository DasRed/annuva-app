import apiRoute from '@/server/api/apiRoute';
import getRequestContext from '@/server/auth/getRequestContext';
import TokenService from '@/server/token/TokenService';

export const DELETE = apiRoute<{ id: string }>(async (request, {id}) => {
    await new TokenService().revoke(await getRequestContext(request), id);
    return new Response(null, {status: 204});
});
