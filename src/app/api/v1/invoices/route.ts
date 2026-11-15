import apiRoute from '@/server/api/apiRoute';
import parseListQuery from '@/server/api/parseListQuery';
import readJson from '@/server/api/readJson';
import getRequestContext from '@/server/auth/getRequestContext';
import InvoiceService from '@/server/invoice/InvoiceService';

export const GET = apiRoute(async (request) => new InvoiceService().list(await getRequestContext(request), parseListQuery(new URL(request.url))));

export const POST = apiRoute(async (request) => {
    const invoice = await new InvoiceService().create(await getRequestContext(request), await readJson(request));
    return Response.json(invoice, {status: 201});
});
