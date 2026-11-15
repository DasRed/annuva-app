import InvoicesPageView from '@/component/invoice/InvoicesPageView';
import pageMetadata from '@/server/page/pageMetadata';

export const generateMetadata = () => pageMetadata('nav.invoices');

export default async function InvoicesPage({searchParams}: { searchParams: Promise<Record<string, string | undefined>> }) {
    const {status} = await searchParams;
    return <InvoicesPageView initialStatus={status ?? ''}/>;
}
