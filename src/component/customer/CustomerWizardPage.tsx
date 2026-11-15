'use client';

import CustomerWizard from '@/component/customer/CustomerWizard';
import PageHeader from '@/component/ui/PageHeader';
import useI18n from '@/i18n/useI18n';

export default function CustomerWizardPage({defaultHostingPerYear, recurringInvoiceMonth}: { defaultHostingPerYear: number; recurringInvoiceMonth: number }) {
    const {t} = useI18n();
    return (
        <>
            <PageHeader eyebrow={t('nav.customers')} title={t('customer.new')} description={t('customer.newDescription')}/>
            <CustomerWizard defaultHostingPerYear={defaultHostingPerYear} recurringInvoiceMonth={recurringInvoiceMonth}/>
        </>
    );
}
