import apiRoute from '@/server/api/apiRoute';
import getRequestContext from '@/server/auth/getRequestContext';
import DashboardService from '@/server/dashboard/DashboardService';

export const GET = apiRoute(async (request) => {
    const params = new URL(request.url).searchParams;
    const year = params.get('year');
    return new DashboardService().get(await getRequestContext(request), {
        customerId: params.get('customer') ?? params.get('customerId'),
        year:       year === null || year === '' ? null : Number(year),
    });
});
