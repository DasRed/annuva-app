'use client';

import {IconPlus, IconSearch} from '@tabler/icons-react';
import Link from 'next/link';
import {useEffect, useState} from 'react';
import apiFetch from '@/client/apiFetch';
import useLookup from '@/client/useLookup';
import InvoiceStatusPill from '@/component/invoice/InvoiceStatusPill';
import Button from '@/component/ui/Button';
import EmptyState from '@/component/ui/EmptyState';
import inputClass from '@/component/ui/inputClass';
import Skeleton from '@/component/ui/Skeleton';
import type ListResult from '@/entity/ListResult';
import useI18n from '@/i18n/useI18n';
import useToday from '@/client/useToday';

/**
 * Invoices with status filter and search; optionally only those of one customer.
 */
export default function InvoiceList({customerId, initialStatus = ''}: { customerId?: string; initialStatus?: string }) {
    const {date, money, t, td} = useI18n();
    const customers = useLookup('customers');
    const [status, setStatus] = useState(initialStatus);
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<ListResult | null>(null);
    const today = useToday();

    useEffect(() => {
        const params = new URLSearchParams({limit: '200', order: 'desc', sort: 'createdAt'});
        if (status !== '') {
            params.set('filter[status]', status);
        }
        if (query.trim() !== '') {
            params.set('q', query.trim());
        }
        if (customerId !== undefined) {
            params.set('customerId', customerId);
        }
        const timer = setTimeout(() => {
            apiFetch<ListResult>(`/api/v1/invoices?${params.toString()}`).then(setResult).catch(() => setResult({items: [], limit: 0, offset: 0, total: 0}));
        }, query === '' ? 0 : 250);
        return () => clearTimeout(timer);
    }, [customerId, query, status]);

    const customerName = (id: unknown) => customers?.find((customer) => customer.id === id)?.title ?? '…';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <label className="relative min-w-48 flex-1 sm:max-w-sm">
                    <span className="sr-only">{t('common.search')}</span>
                    <IconSearch size={18} stroke={1.75} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"/>
                    <input type="search" className={`${inputClass} pl-9`} placeholder={t('common.searchPlaceholder')} value={query} onChange={(event) => setQuery(event.target.value)}/>
                </label>
                <div className="flex flex-wrap gap-1 rounded-full border border-line bg-surface p-1" role="group" aria-label={t('field.invoices.status')}>
                    {['', 'to_issue', 'open', 'paid', 'cancelled'].map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setStatus(value)}
                            aria-pressed={status === value}
                            className={`rounded-full px-3 py-1 text-sm transition ${status === value ? 'bg-accent text-accent-ink' : 'text-text-soft hover:bg-surface-2'}`}
                        >
                            {value === '' ? t('common.all') : td(`enum.invoices.status.${value}`, value)}
                        </button>
                    ))}
                </div>
                <div className="ml-auto">
                    <Button variant="primary" href={customerId === undefined ? '/invoices/new' : `/invoices/new?customerId=${customerId}`} icon={<IconPlus size={18} stroke={1.75}/>}>
                        {t('invoice.new')}
                    </Button>
                </div>
            </div>

            {result === null ? (
                <div className="flex flex-col gap-2">{Array.from({length: 5}, (_, index) => <Skeleton key={index} className="h-10 w-full"/>)}</div>
            ) : result.items.length === 0 ? (
                <EmptyState>{t('invoice.empty')}</EmptyState>
            ) : (
                <ul className="divide-y divide-line">
                    {result.items.map((invoice, index) => (
                        <li key={invoice.id} className="animate-fade" style={{animationDelay: `${Math.min(index, 12) * 25}ms`}}>
                            <Link href={`/invoices/${invoice.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-lg px-2 py-3 transition hover:bg-surface-2/60 md:grid-cols-[9rem_7rem_1fr_minmax(8rem,14rem)_7rem_8rem]">
                                <span className="font-semibold tabular md:font-normal">{String(invoice.number ?? t('invoice.draft'))}</span>
                                <span className="text-right text-sm text-text-muted tabular md:text-left">{date(String(invoice.date ?? invoice.dueDate ?? ''))}</span>
                                <span className="col-span-2 truncate md:col-span-1">{String(invoice.description)}</span>
                                <span className="truncate text-sm text-text-soft">{customerName(invoice.customerId)}</span>
                                <span className="md:text-center"><InvoiceStatusPill status={String(invoice.status)} overdue={invoice.status === 'open' && typeof invoice.dueDate === 'string' && invoice.dueDate < today}/></span>
                                <span className="text-right font-semibold tabular">{money(Math.round(Number(invoice.grossAmount) * 100))}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
