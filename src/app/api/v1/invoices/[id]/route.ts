import apiRoute from '@/server/api/apiRoute';
import readJson from '@/server/api/readJson';
import getRequestContext from '@/server/auth/getRequestContext';
import InvoiceService from '@/server/invoice/InvoiceService';

export const GET = apiRoute<{ id: string }>(async (request, {id}) => new InvoiceService().get(await getRequestContext(request), id));

export const PATCH = apiRoute<{ id: string }>(async (request, {id}) => new InvoiceService().update(await getRequestContext(request), id, await readJson(request)));

export const DELETE = apiRoute<{ id: string }>(async (request, {id}) => {
    await new InvoiceService().remove(await getRequestContext(request), id);
    return new Response(null, {status: 204});
});
