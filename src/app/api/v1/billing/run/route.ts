import apiRoute from '@/server/api/apiRoute';
import readJson from '@/server/api/readJson';
import getRequestContext from '@/server/auth/getRequestContext';
import BillingService from '@/server/billing/BillingService';

export const POST = apiRoute(async (request) => new BillingService().run(await getRequestContext(request), await readJson(request)));
