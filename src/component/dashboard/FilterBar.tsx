'use client';

import {IconFilterOff} from '@tabler/icons-react';
import Button from '@/component/ui/Button';
import inputClass from '@/component/ui/inputClass';
import useI18n from '@/i18n/useI18n';

/**
 * Sticky global filter: year and customer, reset and the current view.
 */
export default function FilterBar({customerId, customers, onChange, pending, planYear, year, years}: {
    customerId: string | null;
    customers: { id: string; name: string }[];
    onChange: (filter: { customerId: string | null; year: number | null }) => void;
    pending: boolean;
    planYear: number;
    year: number | null;
    years: number[];
}) {
    const {t} = useI18n();
    const active = year !== null || customerId !== null;
    const customerName = customers.find((customer) => customer.id === customerId)?.name;

    return (
        <div className="sticky top-[3.6rem] z-20 -mx-4 mb-6 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-8 lg:px-8 2xl:-mx-12 2xl:px-12">
            <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="filter-year">{t('dashboard.year')}</label>
                <select id="filter-year" className={`${inputClass} w-auto min-w-36`} value={year ?? ''} onChange={(event) => onChange({customerId, year: event.target.value === '' ? null : Number(event.target.value)})}>
                    <option value="">{t('dashboard.allYears')}</option>
                    {years.map((value) => <option key={value} value={value}>{value}{value === planYear ? ` (${t('dashboard.planShort')})` : ''}</option>)}
                </select>
                <label className="sr-only" htmlFor="filter-customer">{t('dashboard.customer')}</label>
                <select id="filter-customer" className={`${inputClass} w-auto min-w-44 max-w-full flex-1 sm:flex-none`} value={customerId ?? ''} onChange={(event) => onChange({customerId: event.target.value === '' ? null : event.target.value, year})}>
                    <option value="">{t('dashboard.allCustomers')}</option>
                    {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                </select>
                {active ? <Button size="sm" variant="ghost" icon={<IconFilterOff size={16} stroke={1.75}/>} onClick={() => onChange({customerId: null, year: null})}>{t('dashboard.reset')}</Button> : null}
                <p className="ml-auto flex items-center gap-2 text-sm text-text-muted" aria-live="polite">
                    {pending ? <span className="size-3 animate-spin rounded-full border-2 border-accent border-r-transparent" aria-hidden/> : null}
                    {t('dashboard.view', {customer: customerName ?? t('dashboard.allCustomers'), year: year === null ? t('dashboard.allYears') : String(year)})}
                </p>
            </div>
        </div>
    );
}
