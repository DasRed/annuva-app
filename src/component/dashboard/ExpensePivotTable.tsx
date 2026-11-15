'use client';

import EmptyState from '@/component/ui/EmptyState';
import type DashboardResult from '@/calculation/DashboardResult';
import useI18n from '@/i18n/useI18n';

export default function ExpensePivotTable({pivot}: { pivot: DashboardResult['expensePivot'] }) {
    const {money, t, td} = useI18n();
    if (pivot.rows.length === 0) {
        return <EmptyState>{t('dashboard.noExpenses')}</EmptyState>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-line text-xs tracking-wide text-text-muted uppercase">
                        <th className="px-2 py-2 text-left font-semibold">{t('field.expenses.category')}</th>
                        {pivot.years.map((year) => <th key={year} className="px-2 py-2 text-right font-semibold">{year}</th>)}
                        <th className="px-2 py-2 text-right font-semibold">{t('dashboard.total')}</th>
                    </tr>
                </thead>
                <tbody>
                    {pivot.rows.map((row) => (
                        <tr key={row.category} className="border-b border-line/60">
                            <td className="px-2 py-2">{td(`enum.expenses.category.${row.category}`, row.category)}</td>
                            {pivot.years.map((year) => <td key={year} className="px-2 py-2 text-right tabular">{row.values[year] === 0 ? <span className="text-text-muted">–</span> : money(row.values[year])}</td>)}
                            <td className="px-2 py-2 text-right font-semibold tabular">{money(row.total)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="font-semibold">
                        <td className="px-2 py-2">{t('dashboard.sum')}</td>
                        {pivot.years.map((year) => <td key={year} className="px-2 py-2 text-right tabular">{money(pivot.totals[year])}</td>)}
                        <td className="px-2 py-2 text-right tabular">{money(pivot.total)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
