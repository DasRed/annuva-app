import apiRoute from '@/server/api/apiRoute';
import getRequestContext from '@/server/auth/getRequestContext';
import TwoFactorService from '@/server/auth/TwoFactorService';

export const GET = apiRoute(async (request) => new TwoFactorService().status(await getRequestContext(request)));
