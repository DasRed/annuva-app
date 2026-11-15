import apiRoute from '@/server/api/apiRoute';
import readJson from '@/server/api/readJson';
import getRequestContext from '@/server/auth/getRequestContext';
import TenantService from '@/server/tenant/TenantService';

export const GET = apiRoute(async (request) => new TenantService().getSettings(await getRequestContext(request)));

export const PATCH = apiRoute(async (request) => new TenantService().updateSettings(await getRequestContext(request), await readJson(request)));
