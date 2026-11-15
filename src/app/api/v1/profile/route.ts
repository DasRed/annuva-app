import apiRoute from '@/server/api/apiRoute';
import readJson from '@/server/api/readJson';
import getRequestContext from '@/server/auth/getRequestContext';
import UserService from '@/server/user/UserService';

export const GET = apiRoute(async (request) => new UserService().getProfile(await getRequestContext(request)));

export const PATCH = apiRoute(async (request) => new UserService().updateProfile(await getRequestContext(request), await readJson(request)));
