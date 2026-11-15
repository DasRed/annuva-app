'use client';

import SignedMoney from '@/component/dashboard/SignedMoney';
import Notice from '@/component/ui/Notice';
import type DashboardResult from '@/calculation/DashboardResult';
import useI18n from '@/i18n/useI18n';

/**
 * Estimated tax per year (always the whole business).
 */
export default function TaxTable({rows}: { rows: DashboardResult['tax'] }) {
    const {t} = useI18n();
    const head = 'px-2 py-2 text-right font-semibold';
    return (
        <div className="flex flex-col gap-3">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] text-sm">
                    <thead>
                        <tr className="border-b border-line text-xs tracking-wide text-text-muted uppercase">
                            <th className="px-2 py-2 text-left font-semibold">{t('dashboard.year')}</th>
                            <th className={head}>{t('tax.profit')}</th>
                            <th className={head}>{t('tax.adjustments')}</th>
                            <th className={head}>{t('tax.taxableProfit')}</th>
                            <th className={head}>{t('tax.tax')}</th>
                            <th className={head}>{t('tax.afterTax')}</th>
                            <th className={head}>{t('tax.effectiveYear')}</th>
                            <th className={head}>{t('tax.profitPerAssessment')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.year} className={`border-b border-line/60 ${row.plan ? 'text-text-muted italic' : ''}`}>
                                <td className="px-2 py-2">{row.year}{row.plan ? ` (${t('dashboard.planShort')})` : ''}</td>
                                <td className="px-2 py-2 text-right"><SignedMoney cents={row.profit}/></td>
                                <td className="px-2 py-2 text-right"><SignedMoney cents={row.adjustments === 0 ? null : row.adjustments}/></td>
                                <td className="px-2 py-2 text-right"><SignedMoney cents={row.taxableProfit}/></td>
                                <td className="px-2 py-2 text-right"><SignedMoney cents={row.tax} strong/></td>
                                <td className="px-2 py-2 text-right"><SignedMoney cents={row.afterTax}/></td>
                                <td className="px-2 py-2 text-right tabular">{row.effectiveYear}</td>
                                <td className="px-2 py-2 text-right"><SignedMoney cents={row.profitPerAssessment}/></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Notice tone="info">{t('tax.disclaimer')}</Notice>
        </div>
    );
}
