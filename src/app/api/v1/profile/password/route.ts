import apiRoute from '@/server/api/apiRoute';
import readJson from '@/server/api/readJson';
import getRequestContext from '@/server/auth/getRequestContext';
import UserService from '@/server/user/UserService';

export const POST = apiRoute(async (request) => {
    await new UserService().changePassword(await getRequestContext(request), await readJson(request));
    return {ok: true};
});
