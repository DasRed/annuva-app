import {notFound, redirect} from 'next/navigation';
import InvoiceEditorPage from '@/component/invoice/InvoiceEditorPage';
import ApiError from '@/server/error/ApiError';
import InvoiceService from '@/server/invoice/InvoiceService';
import pageMetadata from '@/server/page/pageMetadata';
import requireSession from '@/server/page/requireSession';

export const generateMetadata = () => pageMetadata('invoice.editDraft');

export default async function EditInvoicePage({params}: { params: Promise<{ id: string }> }) {
    const session = await requireSession();
    const {id} = await params;
    const invoice = await new InvoiceService().get(session.context, id).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) {
            notFound();
        }
        throw error;
    });
    if (invoice.status !== 'to_issue') {
        redirect(`/invoices/${id}`);
    }
    return (
        <InvoiceEditorPage
            invoice={invoice as Parameters<typeof InvoiceEditorPage>[0]['invoice']}
            defaultVatRate={Number(session.settings?.defaultVatRate ?? 19)}
            vatMode={String(session.settings?.vatMode ?? 'small_business')}
        />
    );
}
