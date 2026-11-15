'use client';

import {
    IconArrowBackUp,
    IconBan,
    IconBellRinging,
    IconCash,
    IconDownload,
    IconMail,
    IconPencil,
    IconSend,
    IconTrash,
} from '@tabler/icons-react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import useLookup from '@/client/useLookup';
import InvoiceStatusPill from '@/component/invoice/InvoiceStatusPill';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import ConfirmButton from '@/component/ui/ConfirmButton';
import Dialog from '@/component/ui/Dialog';
import FormField from '@/component/ui/FormField';
import inputClass from '@/component/ui/inputClass';
import Notice from '@/component/ui/Notice';
import PageHeader from '@/component/ui/PageHeader';
import type EntityRecord from '@/entity/EntityRecord';
import useI18n from '@/i18n/useI18n';
import useToday from '@/client/useToday';

const cents = (value: unknown) => Math.round(Number(value) * 100);

/**
 * Invoice detail with the actions allowed in its status and a PDF preview.
 */
export default function InvoiceView({invoice, mailEnabled}: {
    invoice: EntityRecord & { lines: { customerId: string; description: string; id: string; quantity: number; taxRate: number; unitPrice: number }[] };
    mailEnabled: boolean;
}) {
    const {date, money, number, t, td} = useI18n();
    const router = useRouter();
    const customers = useLookup('customers');
    const partners = useLookup('partners');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [dialog, setDialog] = useState<'issue' | 'pay' | 'remind' | 'send' | null>(null);
    const [actionDate, setActionDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [mailTo, setMailTo] = useState('');
    const [message, setMessage] = useState('');

    const status = String(invoice.status);
    const today = useToday();
    const overdue = status === 'open' && typeof invoice.dueDate === 'string' && invoice.dueDate < today;
    const action = async (name: string, body?: unknown) => {
        setBusy(name);
        setError(null);
        try {
            const result = await apiFetch<EntityRecord>(`/api/v1/invoices/${invoice.id}/${name}`, {body: body ?? {}});
            setDialog(null);
            if (name === 'cancel' && result.id !== invoice.id) {
                router.push(`/invoices/${result.id}`);
            }
            router.refresh();
        }
        catch (exception) {
            setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
        }
        finally {
            setBusy(null);
        }
    };

    const recipient = invoice.recipientType === 'partner'
                      ? partners?.find((partner) => partner.id === invoice.partnerId)?.title
                      : customers?.find((customer) => customer.id === invoice.customerId)?.title;

    return (
        <>
            <PageHeader
                eyebrow={<Link href="/invoices" className="hover:underline">{t('nav.invoices')}</Link>}
                title={<span className="flex flex-wrap items-center gap-3">{String(invoice.number ?? t('invoice.draft'))} <InvoiceStatusPill status={status} overdue={overdue}/></span>}
                description={String(invoice.description)}
                actions={(
                    <>
                        {status === 'to_issue' ? (
                            <>
                                <Button href={`/invoices/${invoice.id}/edit`} icon={<IconPencil size={18} stroke={1.75}/>}>{t('common.edit')}</Button>
                                <ConfirmButton
                                    variant="ghost"
                                    icon={<IconTrash size={18} stroke={1.75}/>}
                                    title={t('invoice.deleteTitle')}
                                    message={t('common.deleteMessage')}
                                    confirmLabel={t('common.delete')}
                                    onConfirm={async () => {
                                        await apiFetch(`/api/v1/invoices/${invoice.id}`, {method: 'DELETE'});
                                        router.push('/invoices');
                                        router.refresh();
                                    }}
                                >
                                    {t('common.delete')}
                                </ConfirmButton>
                                <Button variant="primary" icon={<IconSend size={18} stroke={1.75}/>} onClick={() => setDialog('issue')}>{t('invoice.issue')}</Button>
                            </>
                        ) : null}
                        {status !== 'to_issue' ? <Button href={`/api/v1/invoices/${invoice.id}/pdf?download=true`} icon={<IconDownload size={18} stroke={1.75}/>}>{t('invoice.download')}</Button> : null}
                        {status !== 'to_issue' && mailEnabled ? <Button icon={<IconMail size={18} stroke={1.75}/>} onClick={() => setDialog('send')}>{t('invoice.send')}</Button> : null}
                        {status === 'open' && mailEnabled ? <Button icon={<IconBellRinging size={18} stroke={1.75}/>} onClick={() => setDialog('remind')}>{t('invoice.remind')}</Button> : null}
                        {status === 'paid' && invoice.cancelsInvoiceId === null ? (
                            <Button icon={<IconArrowBackUp size={18} stroke={1.75}/>} loading={busy === 'reopen'} onClick={() => action('reopen')}>{t('invoice.reopen')}</Button>
                        ) : null}
                        {(status === 'open' || status === 'paid') && invoice.cancelsInvoiceId === null ? (
                            <ConfirmButton variant="ghost" icon={<IconBan size={18} stroke={1.75}/>} title={t('invoice.cancelTitle')} message={t('invoice.cancelMessage')} confirmLabel={t('invoice.cancel')} onConfirm={() => action('cancel')}>
                                {t('invoice.cancel')}
                            </ConfirmButton>
                        ) : null}
                        {status === 'open' ? <Button variant="primary" icon={<IconCash size={18} stroke={1.75}/>} onClick={() => setDialog('pay')}>{t('invoice.markPaid')}</Button> : null}
                    </>
                )}
            />

            {error !== null ? <div className="mb-4"><Notice tone="error">{error}</Notice></div> : null}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-6">
                    <Card title={t('invoice.details')}>
                        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                            <div><dt className="text-text-muted">{t('invoice.recipient')}</dt><dd className="font-semibold">{recipient ?? '…'}</dd></div>
                            <div><dt className="text-text-muted">{t('field.invoices.customerId')}</dt><dd><Link className="text-accent hover:underline" href={`/customers/${String(invoice.customerId)}`}>{customers?.find((customer) => customer.id === invoice.customerId)?.title ?? '…'}</Link></dd></div>
                            <div><dt className="text-text-muted">{t('field.invoices.date')}</dt><dd className="tabular">{date(invoice.date as string | null)}</dd></div>
                            <div><dt className="text-text-muted">{status === 'to_issue' ? t('invoice.plannedDate') : t('field.invoices.dueDate')}</dt><dd className="tabular">{date(invoice.dueDate as string | null)}</dd></div>
                            <div><dt className="text-text-muted">{t('pdf.servicePeriod')}</dt><dd className="tabular">{invoice.serviceDateFrom === null ? '–' : `${date(invoice.serviceDateFrom as string)}${invoice.serviceDateTo !== null ? ` – ${date(invoice.serviceDateTo as string)}` : ''}`}</dd></div>
                            <div><dt className="text-text-muted">{t('field.invoices.paidAt')}</dt><dd className="tabular">{date(invoice.paidAt as string | null)}</dd></div>
                            {Number(invoice.reminderLevel) > 0 ? <div><dt className="text-text-muted">{t('field.invoices.reminderLevel')}</dt><dd>{String(invoice.reminderLevel)}</dd></div> : null}
                            {invoice.cancelsInvoiceId !== null ? <div><dt className="text-text-muted">{t('invoice.cancels')}</dt><dd><Link className="text-accent hover:underline" href={`/invoices/${String(invoice.cancelsInvoiceId)}`}>{t('invoice.original')}</Link></dd></div> : null}
                            {invoice.notes !== null ? <div className="sm:col-span-2"><dt className="text-text-muted">{t('field.invoices.notes')}</dt><dd className="whitespace-pre-line">{String(invoice.notes)}</dd></div> : null}
                        </dl>
                    </Card>

                    <Card title={t('invoice.lines')}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-line text-left text-xs text-text-muted uppercase">
                                        <th className="py-2 pr-2">{t('pdf.description')}</th>
                                        <th className="py-2 pr-2 text-right">{t('pdf.quantity')}</th>
                                        <th className="py-2 pr-2 text-right">{t('pdf.unitPrice')}</th>
                                        <th className="py-2 text-right">{t('pdf.amount')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.lines.map((line) => (
                                        <tr key={line.id} className="border-b border-line/60">
                                            <td className="py-2 pr-2">{line.description}{invoice.recipientType === 'partner' ? <span className="block text-xs text-text-muted">{customers?.find((customer) => customer.id === line.customerId)?.title}</span> : null}</td>
                                            <td className="py-2 pr-2 text-right tabular">{number(line.quantity)}</td>
                                            <td className="py-2 pr-2 text-right tabular">{money(cents(line.unitPrice))}</td>
                                            <td className="py-2 text-right tabular">{money(Math.round(line.quantity * line.unitPrice * 100))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="text-sm">
                                    {Number(invoice.taxAmount) !== 0 ? (
                                        <>
                                            <tr><td colSpan={3} className="pt-3 text-right text-text-muted">{t('pdf.net')}</td><td className="pt-3 text-right tabular">{money(cents(invoice.netAmount))}</td></tr>
                                            <tr><td colSpan={3} className="text-right text-text-muted">{t('pdf.vat')}</td><td className="text-right tabular">{money(cents(invoice.taxAmount))}</td></tr>
                                        </>
                                    ) : null}
                                    <tr className="text-base font-semibold"><td colSpan={3} className="pt-2 text-right">{t('pdf.total')}</td><td className="pt-2 text-right tabular">{money(cents(invoice.grossAmount))}</td></tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>
                </div>

                <Card title={status === 'to_issue' ? t('invoice.preview') : t('invoice.pdf')} className="xl:sticky xl:top-8 xl:self-start">
                    {/* oxlint-disable-next-line react/iframe-missing-sandbox -- the browser PDF viewer does not work in a sandbox */}
                    <iframe title="PDF" src={`/api/v1/invoices/${invoice.id}/pdf`} className="h-[70vh] min-h-[28rem] w-full rounded-lg border border-line bg-white"/>
                </Card>
            </div>

            <Dialog
                open={dialog !== null}
                onClose={() => setDialog(null)}
                title={dialog === null ? '' : t(`invoice.${dialog === 'pay' ? 'markPaid' : dialog}`)}
                footer={(
                    <>
                        <Button variant="ghost" onClick={() => setDialog(null)}>{t('common.cancel')}</Button>
                        <Button
                            variant="primary"
                            loading={busy !== null}
                            onClick={() => {
                                if (dialog === 'issue') {
                                    void action('issue', {date: actionDate});
                                }
                                else if (dialog === 'pay') {
                                    void action('pay', {paidAt: actionDate});
                                }
                                else if (dialog !== null) {
                                    void action(dialog, {message: message === '' ? undefined : message, to: mailTo === '' ? undefined : mailTo});
                                }
                            }}
                        >
                            {t('common.confirm')}
                        </Button>
                    </>
                )}
            >
                {dialog === 'issue' || dialog === 'pay' ? (
                    <div className="flex flex-col gap-4">
                        {dialog === 'issue' ? <Notice tone="info">{t('invoice.issueHint')}</Notice> : null}
                        <FormField label={dialog === 'issue' ? t('field.invoices.date') : t('field.invoices.paidAt')} htmlFor="invoice-action-date">
                            <input id="invoice-action-date" type="date" className={inputClass} value={actionDate} onChange={(event) => setActionDate(event.target.value)}/>
                        </FormField>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <FormField label={t('invoice.mailTo')} htmlFor="invoice-mail-to" hint={t('invoice.mailToHint')}>
                            <input id="invoice-mail-to" type="email" className={inputClass} value={mailTo} onChange={(event) => setMailTo(event.target.value)}/>
                        </FormField>
                        <FormField label={t('invoice.message')} htmlFor="invoice-message" hint={t('invoice.messageHint')}>
                            <textarea id="invoice-message" rows={6} className={inputClass} value={message} onChange={(event) => setMessage(event.target.value)}/>
                        </FormField>
                        <p className="text-xs text-text-muted">{td('invoice.mailNote')}</p>
                    </div>
                )}
            </Dialog>
        </>
    );
}
