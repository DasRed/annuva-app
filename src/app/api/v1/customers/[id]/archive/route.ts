import apiRoute from '@/server/api/apiRoute';
import getRequestContext from '@/server/auth/getRequestContext';
import setCustomerArchived from '@/server/customer/setCustomerArchived';

export const POST = apiRoute<{ id: string }>(async (request, {id}) => setCustomerArchived(await getRequestContext(request), id, true));

export const DELETE = apiRoute<{ id: string }>(async (request, {id}) => setCustomerArchived(await getRequestContext(request), id, false));
