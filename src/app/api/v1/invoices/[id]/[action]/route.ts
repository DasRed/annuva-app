import apiRoute from '@/server/api/apiRoute';
import readJson from '@/server/api/readJson';
import getRequestContext from '@/server/auth/getRequestContext';
import ApiError from '@/server/error/ApiError';
import InvoiceService from '@/server/invoice/InvoiceService';

/**
 * Status actions: issue, pay, reopen, cancel, send, remind.
 */
export const POST = apiRoute<{ action: string; id: string }>(async (request, {action, id}) => {
    const context = await getRequestContext(request);
    const service = new InvoiceService();
    const body = await readJson(request);
    switch (action) {
        case 'issue':
            return service.issue(context, id, body);
        case 'pay':
            return service.markPaid(context, id, body);
        case 'reopen':
            return service.reopen(context, id);
        case 'cancel':
            return service.cancel(context, id);
        case 'send':
            return service.send(context, id, body);
        case 'remind':
            return service.remind(context, id, body);
        default:
            throw ApiError.notFound(`Unknown invoice action "${action}".`);
    }
});
