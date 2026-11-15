'use client';

import {IconAlertTriangle} from '@tabler/icons-react';
import Link from 'next/link';
import SignedMoney from '@/component/dashboard/SignedMoney';
import EmptyState from '@/component/ui/EmptyState';
import Pill from '@/component/ui/Pill';
import type DashboardResult from '@/calculation/DashboardResult';
import useI18n from '@/i18n/useI18n';
import useToday from '@/client/useToday';

/**
 * Upcoming items: date, kind, what, customer/recipient, amount (+/−).
 */
export default function UpcomingTable({items}: { items: DashboardResult['upcoming'] }) {
    const {date, t, td} = useI18n();
    const today = useToday();
    if (items.length === 0) {
        return <EmptyState>{t('dashboard.nothingUpcoming')}</EmptyState>;
    }
    return (
        <ul className="divide-y divide-line">
            {items.map((item) => {
                const overdue = item.date !== null && item.date < today;
                const title = item.kind === 'recurring_invoice'
                              ? item.title.split(', ').map((service) => td(`enum.recurringCharges.service.${service}`, service)).join(', ')
                              : item.title;
                return (
                    <li key={`${item.kind}-${item.refId}`} className="grid grid-cols-[6.5rem_1fr_auto] items-start gap-x-3 gap-y-1 py-2.5 text-sm md:grid-cols-[6.5rem_10rem_1fr_minmax(10rem,18rem)_8rem]">
                        <span className={`tabular ${overdue ? 'font-semibold text-negative' : 'text-text-soft'}`}>{item.date === null ? t('dashboard.noDate') : date(item.date)}</span>
                        <span className="order-last col-span-3 md:order-none md:col-span-1">
                            <Pill tone={{issue_invoice: 'info', planned_cost: 'warning', recurring_invoice: 'accent', renewal: 'neutral'}[item.kind] as 'info'}>{t(`upcoming.${item.kind}` as 'upcoming.renewal')}</Pill>
                        </span>
                        <span className="min-w-0">
                            {item.kind === 'issue_invoice' ? <Link href={`/invoices/${item.refId}`} className="font-medium hover:text-accent">{title}</Link> : <span className="font-medium">{title}</span>}
                            {item.rebilled ? <span className="ml-2 text-xs text-text-muted">{t('upcoming.rebilled')}</span> : null}
                            {item.archivedCustomer ? <span className="ml-2 inline-flex items-center gap-1 text-xs text-warning"><IconAlertTriangle size={13}/>{t('upcoming.archivedCustomer')}</span> : null}
                        </span>
                        <span className="hidden min-w-0 text-text-soft md:block">
                            <span className="block truncate">{item.recipient}</span>
                            {item.customers.length > 1 || item.customers[0] !== item.recipient ? <span className="block truncate text-xs text-text-muted">{item.customers.join(', ')}</span> : null}
                        </span>
                        <span className="text-right"><SignedMoney cents={item.amount} strong/></span>
                    </li>
                );
            })}
        </ul>
    );
}
