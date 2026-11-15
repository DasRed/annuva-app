import {notFound} from 'next/navigation';
import InvoiceView from '@/component/invoice/InvoiceView';
import ApiError from '@/server/error/ApiError';
import InvoiceService from '@/server/invoice/InvoiceService';
import MailService from '@/server/mail/MailService';
import pageMetadata from '@/server/page/pageMetadata';
import requireSession from '@/server/page/requireSession';

export const generateMetadata = () => pageMetadata('nav.invoices');

export default async function InvoicePage({params}: { params: Promise<{ id: string }> }) {
    const session = await requireSession();
    const {id} = await params;
    const invoice = await new InvoiceService().get(session.context, id).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) {
            notFound();
        }
        throw error;
    });
    return <InvoiceView invoice={invoice as Parameters<typeof InvoiceView>[0]['invoice']} mailEnabled={MailService.isEnabled()}/>;
}
