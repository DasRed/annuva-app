'use client';

import {IconPlus, IconTrash} from '@tabler/icons-react';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import RelationSelect from '@/component/entity/RelationSelect';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import FormField from '@/component/ui/FormField';
import inputClass from '@/component/ui/inputClass';
import Notice from '@/component/ui/Notice';
import type EntityRecord from '@/entity/EntityRecord';
import useI18n from '@/i18n/useI18n';

type Line = { customerId: string; description: string; quantity: string; taxRate: string; unitPrice: string };

/**
 * Create or edit a draft invoice with its positions. Totals are previewed live; the server
 * calculates the binding amounts.
 */
export default function InvoiceEditor({customerId: initialCustomerId, defaultVatRate, invoice, vatMode}: {
    customerId?: string;
    defaultVatRate: number;
    invoice?: EntityRecord & { lines: { customerId: string; description: string; quantity: number; taxRate: number; unitPrice: number }[] };
    vatMode: string;
}) {
    const {money, t, td} = useI18n();
    const router = useRouter();
    const regular = vatMode === 'regular';
    const [customerId, setCustomerId] = useState(String(invoice?.customerId ?? initialCustomerId ?? ''));
    const [recipientType, setRecipientType] = useState(String(invoice?.recipientType ?? 'customer'));
    const [partnerId, setPartnerId] = useState(String(invoice?.partnerId ?? ''));
    const [templateId, setTemplateId] = useState(String(invoice?.templateId ?? ''));
    const [description, setDescription] = useState(String(invoice?.description ?? ''));
    const [dueDate, setDueDate] = useState(String(invoice?.dueDate ?? ''));
    const [serviceDateFrom, setServiceDateFrom] = useState(String(invoice?.serviceDateFrom ?? ''));
    const [serviceDateTo, setServiceDateTo] = useState(String(invoice?.serviceDateTo ?? ''));
    const [language, setLanguage] = useState(String(invoice?.language ?? 'de'));
    const [notes, setNotes] = useState(String(invoice?.notes ?? ''));
    const [lines, setLines] = useState<Line[]>(() => (invoice?.lines ?? []).map((line) => ({
        customerId:  line.customerId,
        description: line.description,
        quantity:    String(line.quantity),
        taxRate:     String(line.taxRate),
        unitPrice:   String(line.unitPrice),
    })));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (customerId === '' || invoice !== undefined) {
            return;
        }
        apiFetch<EntityRecord>(`/api/v1/customers/${customerId}`).then((customer) => {
            setRecipientType(customer.channel === 'partner' ? 'partner' : 'customer');
            setPartnerId(String(customer.partnerId ?? ''));
            setLanguage(String(customer.language ?? 'de'));
        }).catch(() => undefined);
    }, [customerId, invoice]);

    const newLine = (): Line => ({customerId: '', description: '', quantity: '1', taxRate: String(defaultVatRate), unitPrice: ''});
    const lineNet = (line: Line) => Math.round(Number(line.quantity || 0) * Number(line.unitPrice || 0) * 100);
    const net = lines.reduce((sum, line) => sum + lineNet(line), 0);
    const tax = regular ? lines.reduce((sum, line) => sum + Math.round((lineNet(line) * Number(line.taxRate || 0)) / 100), 0) : 0;

    const save = async () => {
        setSaving(true);
        setError(null);
        setErrors({});
        const body = {
            customerId,
            description,
            dueDate:         dueDate === '' ? null : dueDate,
            language,
            lines:           lines.map((line) => ({
                customerId:  line.customerId === '' ? null : line.customerId,
                description: line.description,
                quantity:    Number(line.quantity || 1),
                taxRate:     regular ? Number(line.taxRate || 0) : null,
                unitPrice:   Number(line.unitPrice || 0),
            })),
            notes:           notes === '' ? null : notes,
            partnerId:       recipientType === 'partner' && partnerId !== '' ? partnerId : null,
            recipientType,
            serviceDateFrom: serviceDateFrom === '' ? null : serviceDateFrom,
            serviceDateTo:   serviceDateTo === '' ? null : serviceDateTo,
            templateId:      templateId === '' ? null : templateId,
        };
        try {
            const saved = invoice === undefined
                          ? await apiFetch<EntityRecord>('/api/v1/invoices', {body})
                          : await apiFetch<EntityRecord>(`/api/v1/invoices/${invoice.id}`, {body, method: 'PATCH'});
            router.push(`/invoices/${saved.id}`);
            router.refresh();
        }
        catch (exception) {
            if (exception instanceof ApiClientError) {
                setError(exception.message);
                setErrors(exception.fieldErrors);
            }
            else {
                setError(t('common.error'));
            }
        }
        finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="flex flex-col gap-6">
                <Card title={t('invoice.recipient')}>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <FormField label={t('field.invoices.customerId')} htmlFor="invoice-customer" required error={errors.customerId}>
                            <RelationSelect id="invoice-customer" relation="customers" required value={customerId} onChange={setCustomerId} invalid={errors.customerId !== undefined}/>
                        </FormField>
                        <FormField label={t('field.invoices.recipientType')} htmlFor="invoice-recipient-type">
                            <select id="invoice-recipient-type" className={inputClass} value={recipientType} onChange={(event) => setRecipientType(event.target.value)}>
                                <option value="customer">{td('enum.invoices.recipientType.customer')}</option>
                                <option value="partner">{td('enum.invoices.recipientType.partner')}</option>
                            </select>
                        </FormField>
                        {recipientType === 'partner' ? (
                            <FormField label={t('field.invoices.partnerId')} htmlFor="invoice-partner" required error={errors.partnerId}>
                                <RelationSelect id="invoice-partner" relation="partners" required value={partnerId} onChange={setPartnerId}/>
                            </FormField>
                        ) : null}
                        <FormField label={t('field.invoices.templateId')} htmlFor="invoice-template" hint={t('invoice.templateHint')}>
                            <RelationSelect id="invoice-template" relation="invoiceTemplates" value={templateId} onChange={setTemplateId}/>
                        </FormField>
                        <FormField label={t('field.invoices.language')} htmlFor="invoice-language">
                            <select id="invoice-language" className={inputClass} value={language} onChange={(event) => setLanguage(event.target.value)}>
                                <option value="de">{td('enum.invoices.language.de')}</option>
                                <option value="en">{td('enum.invoices.language.en')}</option>
                            </select>
                        </FormField>
                    </div>
                </Card>

                <Card title={t('invoice.details')}>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <FormField label={t('field.invoices.description')} htmlFor="invoice-description" required error={errors.description} className="sm:col-span-2">
                            <input id="invoice-description" className={inputClass} value={description} onChange={(event) => setDescription(event.target.value)} aria-invalid={errors.description !== undefined}/>
                        </FormField>
                        <FormField label={t('invoice.plannedDate')} htmlFor="invoice-due" hint={t('invoice.plannedDateHint')}>
                            <input id="invoice-due" type="date" className={inputClass} value={dueDate} onChange={(event) => setDueDate(event.target.value)}/>
                        </FormField>
                        <div className="hidden xl:block"/>
                        <FormField label={t('field.invoices.serviceDateFrom')} htmlFor="invoice-service-from">
                            <input id="invoice-service-from" type="date" className={inputClass} value={serviceDateFrom} onChange={(event) => setServiceDateFrom(event.target.value)}/>
                        </FormField>
                        <FormField label={t('field.invoices.serviceDateTo')} htmlFor="invoice-service-to">
                            <input id="invoice-service-to" type="date" className={inputClass} value={serviceDateTo} onChange={(event) => setServiceDateTo(event.target.value)}/>
                        </FormField>
                        <FormField label={t('field.invoices.notes')} htmlFor="invoice-notes" className="sm:col-span-full">
                            <textarea id="invoice-notes" rows={2} className={inputClass} value={notes} onChange={(event) => setNotes(event.target.value)}/>
                        </FormField>
                    </div>
                </Card>

                <Card title={t('invoice.lines')} actions={<Button size="sm" icon={<IconPlus size={16} stroke={1.75}/>} onClick={() => setLines([...lines, newLine()])}>{t('invoice.addLine')}</Button>}>
                    {errors.lines !== undefined ? <div className="mb-3"><Notice tone="error">{t('invoice.linesRequired')}</Notice></div> : null}
                    <div className="flex flex-col gap-3">
                        {lines.map((line, index) => {
                            const update = (patch: Partial<Line>) => setLines(lines.map((candidate, position) => (position === index ? {...candidate, ...patch} : candidate)));
                            return (
                                <div key={index} className={`animate-pop grid gap-3 rounded-lg border border-line bg-surface-2/40 p-3 sm:grid-cols-6 ${regular ? 'xl:grid-cols-[1fr_6rem_9rem_6rem_9rem_auto]' : 'xl:grid-cols-[1fr_6rem_9rem_9rem_auto]'} xl:items-end`}>
                                    <FormField label={t('pdf.description')} htmlFor={`line-${index}-description`} className="sm:col-span-6 xl:col-span-1">
                                        <input id={`line-${index}-description`} className={inputClass} value={line.description} onChange={(event) => update({description: event.target.value})}/>
                                    </FormField>
                                    <FormField label={t('pdf.quantity')} htmlFor={`line-${index}-quantity`} className="sm:col-span-2 xl:col-span-1">
                                        <input id={`line-${index}-quantity`} type="number" step="0.01" min="0" className={`${inputClass} text-right tabular`} value={line.quantity} onChange={(event) => update({quantity: event.target.value})}/>
                                    </FormField>
                                    <FormField label={t('pdf.unitPrice')} htmlFor={`line-${index}-price`} className="sm:col-span-2 xl:col-span-1">
                                        <input id={`line-${index}-price`} type="number" step="0.01" className={`${inputClass} text-right tabular`} value={line.unitPrice} onChange={(event) => update({unitPrice: event.target.value})}/>
                                    </FormField>
                                    {regular ? (
                                        <FormField label={t('invoice.taxRate')} htmlFor={`line-${index}-tax`} className="sm:col-span-2 xl:col-span-1">
                                            <input id={`line-${index}-tax`} type="number" step="0.01" min="0" max="100" className={`${inputClass} text-right tabular`} value={line.taxRate} onChange={(event) => update({taxRate: event.target.value})}/>
                                        </FormField>
                                    ) : null}
                                    {recipientType === 'partner' ? (
                                        <FormField label={t('invoice.lineCustomer')} htmlFor={`line-${index}-customer`} className="sm:col-span-3 xl:col-span-1">
                                            <RelationSelect id={`line-${index}-customer`} relation="customers" value={line.customerId} onChange={(value) => update({customerId: value})}/>
                                        </FormField>
                                    ) : <div className="hidden xl:block"/>}
                                    <div className="flex items-center justify-between gap-2 sm:col-span-6 xl:col-span-1 xl:justify-end">
                                        <span className="font-semibold tabular xl:hidden">{money(lineNet(line))}</span>
                                        <Button variant="ghost" size="sm" icon={<IconTrash size={16} stroke={1.75}/>} onClick={() => setLines(lines.filter((_, position) => position !== index))} aria-label={t('common.remove')}/>
                                    </div>
                                </div>
                            );
                        })}
                        {lines.length === 0 ? <Button variant="secondary" icon={<IconPlus size={18} stroke={1.75}/>} onClick={() => setLines([newLine()])}>{t('invoice.addLine')}</Button> : null}
                    </div>
                </Card>
            </div>

            <div className="2xl:sticky 2xl:top-8 2xl:self-start">
                <Card title={t('invoice.summary')}>
                    <dl className="flex flex-col gap-2 text-sm">
                        {regular ? (
                            <>
                                <div className="flex justify-between"><dt className="text-text-muted">{t('pdf.net')}</dt><dd className="tabular">{money(net)}</dd></div>
                                <div className="flex justify-between"><dt className="text-text-muted">{t('pdf.vat')}</dt><dd className="tabular">{money(tax)}</dd></div>
                            </>
                        ) : null}
                        <div className="flex justify-between border-t border-line pt-2 text-lg font-semibold"><dt>{t('pdf.total')}</dt><dd className="tabular">{money(net + tax)}</dd></div>
                    </dl>
                    {!regular ? <p className="mt-3 text-xs text-text-muted">{t('pdf.smallBusiness')}</p> : null}
                    {error !== null ? <div className="mt-4"><Notice tone="error">{error}</Notice></div> : null}
                    <div className="mt-5 flex flex-wrap gap-2">
                        <Button variant="primary" loading={saving} onClick={save} className="flex-1">{t('invoice.saveDraft')}</Button>
                        <Button variant="ghost" href={invoice === undefined ? '/invoices' : `/invoices/${invoice.id}`}>{t('common.cancel')}</Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
