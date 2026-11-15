'use client';

import InvoiceEditor from '@/component/invoice/InvoiceEditor';
import PageHeader from '@/component/ui/PageHeader';
import type EntityRecord from '@/entity/EntityRecord';
import useI18n from '@/i18n/useI18n';

export default function InvoiceEditorPage({customerId, defaultVatRate, invoice, vatMode}: {
    customerId?: string;
    defaultVatRate: number;
    invoice?: EntityRecord & { lines: { customerId: string; description: string; quantity: number; taxRate: number; unitPrice: number }[] };
    vatMode: string;
}) {
    const {t} = useI18n();
    return (
        <>
            <PageHeader eyebrow={t('nav.invoices')} title={invoice === undefined ? t('invoice.new') : t('invoice.editDraft')} description={t('invoice.editorDescription')}/>
            <InvoiceEditor customerId={customerId} defaultVatRate={defaultVatRate} invoice={invoice} vatMode={vatMode}/>
        </>
    );
}
