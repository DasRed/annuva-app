import apiRoute from '@/server/api/apiRoute';
import readJson from '@/server/api/readJson';
import assertAdmin from '@/server/auth/assertAdmin';
import getRequestContext from '@/server/auth/getRequestContext';
import buildTemplatePreviewSnapshot from '@/server/invoice/buildTemplatePreviewSnapshot';
import renderInvoicePdf from '@/server/pdf/renderInvoicePdf';

/**
 * PDF preview of an invoice template – also of unsaved values – with sample data.
 */
export const POST = apiRoute(async (request) => {
    const context = await getRequestContext(request);
    assertAdmin(context);
    const values = await readJson(request);
    const snapshot = await buildTemplatePreviewSnapshot(context, values !== null && typeof values === 'object' ? values as Record<string, never> : {});
    return new Response(new Uint8Array(await renderInvoicePdf(snapshot, false)), {
        headers: {
            'Cache-Control':       'private, no-store',
            'Content-Disposition': 'inline; filename="preview.pdf"',
            'Content-Type':        'application/pdf',
        },
    });
});
