'use client';

import {IconPlayerPlay} from '@tabler/icons-react';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import apiFetch from '@/client/apiFetch';
import type BillingRunResult from '@/client/BillingRunResult';
import ApiClientError from '@/client/ApiClientError';
import Button from '@/component/ui/Button';
import Dialog from '@/component/ui/Dialog';
import FormField from '@/component/ui/FormField';
import inputClass from '@/component/ui/inputClass';
import Notice from '@/component/ui/Notice';
import useI18n from '@/i18n/useI18n';


/**
 * Recurring billing run: preview due charges, then create draft invoices grouped by recipient.
 */
export default function BillingRunButton() {
    const {money, t} = useI18n();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [until, setUntil] = useState(() => new Date().toISOString().slice(0, 10));
    const [preview, setPreview] = useState<BillingRunResult | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run = async (dryRun: boolean) => {
        setBusy(true);
        setError(null);
        try {
            const result = await apiFetch<BillingRunResult>('/api/v1/billing/run', {body: {dryRun, until}});
            if (dryRun) {
                setPreview(result);
            }
            else {
                setOpen(false);
                router.push('/invoices?status=to_issue');
                router.refresh();
            }
        }
        catch (exception) {
            setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
        }
        finally {
            setBusy(false);
        }
    };

    return (
        <>
            <Button icon={<IconPlayerPlay size={18} stroke={1.75}/>} onClick={() => {
                setPreview(null);
                setOpen(true);
            }}>
                {t('billing.run')}
            </Button>
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                title={t('billing.run')}
                footer={(
                    <>
                        <Button variant="ghost" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                        <Button loading={busy && preview === null} onClick={() => run(true)}>{t('billing.preview')}</Button>
                        <Button variant="primary" loading={busy && preview !== null} disabled={preview === null || preview.preview.length === 0} onClick={() => run(false)}>
                            {t('billing.create')}
                        </Button>
                    </>
                )}
            >
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-text-soft">{t('billing.explanation')}</p>
                    <FormField label={t('billing.until')} htmlFor="billing-until">
                        <input id="billing-until" type="date" className={inputClass} value={until} onChange={(event) => {
                            setUntil(event.target.value);
                            setPreview(null);
                        }}/>
                    </FormField>
                    {error !== null ? <Notice tone="error">{error}</Notice> : null}
                    {preview !== null ? (
                        preview.preview.length === 0
                        ? <Notice tone="info">{t('billing.nothingDue')}</Notice>
                        : (
                            <ul className="divide-y divide-line rounded-lg border border-line">
                                {preview.preview.map((row) => (
                                    <li key={row.recipient} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                                        <span>{t('billing.previewRow', {count: row.charges})}</span>
                                        <span className="tabular font-semibold">{money(Math.round(row.total * 100))}</span>
                                    </li>
                                ))}
                            </ul>
                        )
                    ) : null}
                    {preview !== null && preview.skipped > 0 ? <Notice tone="info">{t('billing.skipped', {count: preview.skipped})}</Notice> : null}
                </div>
            </Dialog>
        </>
    );
}
