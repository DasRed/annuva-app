'use client';

import {IconCloudCheck} from '@tabler/icons-react';
import {useRouter} from 'next/navigation';
import {useCallback} from 'react';
import apiFetch from '@/client/apiFetch';
import EntityForm from '@/component/entity/EntityForm';
import PageHeader from '@/component/ui/PageHeader';
import settingsFields from '@/entity/settingsFields';
import useI18n from '@/i18n/useI18n';

/**
 * Business settings of the tenant, grouped in sections. Every change is saved immediately and takes
 * effect right away.
 */
export default function SettingsForm({settings}: { settings: Record<string, unknown> }) {
    const {t} = useI18n();
    const router = useRouter();
    const save = useCallback(async (changes: Record<string, unknown>) => {
        await apiFetch('/api/v1/settings', {body: changes, method: 'PATCH'});
        router.refresh();
    }, [router]);

    return (
        <>
            <PageHeader eyebrow={t('nav.group.admin')} title={t('nav.settings')} description={t('settings.description')}/>
            <p className="mb-4 flex items-center gap-2 text-sm text-text-muted">
                <IconCloudCheck size={18} stroke={1.75}/>{t('common.autoSaveHint')}
            </p>
            <EntityForm
                autoSave={save}
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
            />
        </>
    );
}
