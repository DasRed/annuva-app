'use client';

import {useRouter} from 'next/navigation';
import {useState} from 'react';
import apiFetch from '@/client/apiFetch';
import EntityForm from '@/component/entity/EntityForm';
import Button from '@/component/ui/Button';
import Notice from '@/component/ui/Notice';
import PageHeader from '@/component/ui/PageHeader';
import settingsFields from '@/entity/settingsFields';
import useI18n from '@/i18n/useI18n';

/**
 * Business settings of the tenant, grouped in sections.
 */
export default function SettingsForm({settings}: { settings: Record<string, unknown> }) {
    const {t} = useI18n();
    const router = useRouter();
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    return (
        <>
            <PageHeader
                eyebrow={t('nav.group.admin')}
                title={t('nav.settings')}
                description={t('settings.description')}
                actions={<Button variant="primary" type="submit" form="settings" loading={saving}>{t('common.save')}</Button>}
            />
            {saved ? <div className="mb-4"><Notice tone="success">{t('common.saved')}</Notice></div> : null}
            <EntityForm
                entity="settings"
                fields={settingsFields}
                formId="settings"
                initial={settings}
                sections={[
                    {fields: ['name', 'companyName', 'address', 'email', 'phone', 'website'], title: t('settings.group.company')},
                    {fields: ['vatMode', 'defaultVatRate', 'taxNumber', 'vatId', 'taxPaymentMonth'], title: t('settings.group.tax')},
                    {fields: ['invoiceNumberFormat', 'currency', 'locale', 'timezone', 'recurringInvoiceMonth', 'defaultHourlyRate', 'defaultHostingPerYear', 'domainPassThrough', 'serverCostAllocation'], title: t('settings.group.invoicing')},
                    {fields: ['bankName', 'iban', 'bic'], title: t('settings.group.bank')},
                ]}
                onSubmit={async (data) => {
                    setSaving(true);
                    setSaved(false);
                    try {
                        await apiFetch('/api/v1/settings', {body: data, method: 'PATCH'});
                        setSaved(true);
                        router.refresh();
                    }
                    finally {
                        setSaving(false);
                    }
                }}
            />
        </>
    );
}
