'use client';

import Link from 'next/link';
import RatingPill from '@/component/dashboard/RatingPill';
import SignedMoney from '@/component/dashboard/SignedMoney';
import type DashboardResult from '@/calculation/DashboardResult';
import useI18n from '@/i18n/useI18n';

/**
 * "Is it worth it?" table per customer.
 */
export default function CustomerRatingTable({customers, onSelect}: { customers: DashboardResult['customers']; onSelect: (id: string) => void }) {
    const {money, t} = useI18n();
    const head = 'px-3 py-2 text-right font-semibold';
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
                <thead>
                    <tr className="border-b border-line text-xs tracking-wide text-text-muted uppercase">
                        <th className="px-3 py-2 text-left font-semibold">{t('dashboard.customer')}</th>
                        <th className={head}>{t('dashboard.revenue')}</th>
                        <th className={head}>{t('dashboard.costs')}</th>
                        <th className={head}>{t('dashboard.result')}</th>
                        <th className={head}>{t('dashboard.recurringPerYear')}</th>
                        <th className={head}>{t('dashboard.domainsPackagesPerYear')}</th>
                        <th className={head}>{t('dashboard.serverShare')}</th>
                        <th className={head}>{t('dashboard.surplus')}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t('dashboard.rating')}</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((row) => (
                        <tr key={row.customerId} className={`border-b border-line/60 transition hover:bg-surface-2/60 ${row.archived ? 'opacity-60' : ''}`}>
                            <td className="px-3 py-2">
                                <button type="button" className="text-left font-medium hover:text-accent" onClick={() => onSelect(row.customerId)}>{row.name}</button>
                                <Link href={`/customers/${row.customerId}`} className="ml-2 text-xs text-accent hover:underline">{t('common.open')}</Link>
                            </td>
                            <td className="px-3 py-2 text-right tabular">{money(row.revenue)}</td>
                            <td className="px-3 py-2 text-right tabular">{money(row.costs)}</td>
                            <td className="px-3 py-2 text-right"><SignedMoney cents={row.result} strong/></td>
                            <td className="px-3 py-2 text-right tabular">{money(row.recurringPerYear)}</td>
                            <td className="px-3 py-2 text-right tabular">{money(row.domainsPackagesPerYear)}</td>
                            <td className="px-3 py-2 text-right tabular">{money(row.serverShare)}</td>
                            <td className="px-3 py-2 text-right"><SignedMoney cents={row.surplus}/></td>
                            <td className="px-3 py-2"><RatingPill rating={row.rating}/></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
