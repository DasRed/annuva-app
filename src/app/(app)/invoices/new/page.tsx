import InvoiceEditorPage from '@/component/invoice/InvoiceEditorPage';
import pageMetadata from '@/server/page/pageMetadata';
import requireSession from '@/server/page/requireSession';

export const generateMetadata = () => pageMetadata('invoice.new');

export default async function NewInvoicePage({searchParams}: { searchParams: Promise<Record<string, string | undefined>> }) {
    const session = await requireSession();
    const {customerId} = await searchParams;
    return (
        <InvoiceEditorPage
            customerId={customerId}
            defaultVatRate={Number(session.settings?.defaultVatRate ?? 19)}
            vatMode={String(session.settings?.vatMode ?? 'small_business')}
        />
    );
}
