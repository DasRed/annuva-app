'use client';

import BillingRunButton from '@/component/invoice/BillingRunButton';
import InvoiceList from '@/component/invoice/InvoiceList';
import Card from '@/component/ui/Card';
import PageHeader from '@/component/ui/PageHeader';
import useI18n from '@/i18n/useI18n';

export default function InvoicesPageView({initialStatus}: { initialStatus: string }) {
    const {t} = useI18n();
    return (
        <>
            <PageHeader eyebrow={t('entity.invoices.eyebrow')} title={t('entity.invoices.plural')} description={t('entity.invoices.description')} actions={<BillingRunButton/>}/>
            <Card>
                <InvoiceList initialStatus={initialStatus}/>
            </Card>
        </>
    );
}
