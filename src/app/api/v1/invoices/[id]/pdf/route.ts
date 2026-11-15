import apiRoute from '@/server/api/apiRoute';
import getRequestContext from '@/server/auth/getRequestContext';
import InvoiceService from '@/server/invoice/InvoiceService';

export const GET = apiRoute<{ id: string }>(async (request, {id}) => {
    const {content, filename} = await new InvoiceService().pdf(await getRequestContext(request), id);
    const inline = new URL(request.url).searchParams.get('download') !== 'true';
    return new Response(new Uint8Array(content), {
        headers: {
            'Cache-Control':       'private, no-store',
            'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(filename)}"`,
            'Content-Type':        'application/pdf',
        },
    });
});
