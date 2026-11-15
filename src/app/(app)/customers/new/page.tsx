import CustomerWizardPage from '@/component/customer/CustomerWizardPage';
import pageMetadata from '@/server/page/pageMetadata';
import requireSession from '@/server/page/requireSession';

export const generateMetadata = () => pageMetadata('customer.new');

export default async function NewCustomerPage() {
    const session = await requireSession();
    return (
        <CustomerWizardPage
            defaultHostingPerYear={Number(session.settings?.defaultHostingPerYear ?? 60)}
            recurringInvoiceMonth={Number(session.settings?.recurringInvoiceMonth ?? 1)}
        />
    );
}
