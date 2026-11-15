import type DashboardInput from '@/calculation/DashboardInput';
import type DashboardResult from '@/calculation/DashboardResult';

/**
 * Estimated income tax per year at the marginal rate. Always for the whole business (no customer
 * filter). An estimate, not tax advice: the model assumes the profit is taxed on top of other income.
 */
export default function computeTax(input: DashboardInput, years: DashboardResult['years']): DashboardResult['tax'] {
    return years.map((row) => {
        const adjustments = input.taxAdjustments.filter((adjustment) => adjustment.year === row.year).reduce((sum, adjustment) => sum + adjustment.profitAdjustment, 0);
        const settings = input.taxYears.find((taxYear) => taxYear.year === row.year);
        const taxableProfit = row.result + adjustments;
        const rate = settings?.marginalRatePercent ?? null;
        const tax = rate === null ? null : Math.round((taxableProfit * rate) / 10_000);
        return {
            adjustments,
            afterTax:            tax === null ? null : row.result - tax,
            effectiveYear:       row.year + 1,
            plan:                row.plan,
            profit:              row.result,
            profitPerAssessment: settings?.profitPerAssessment ?? null,
            tax,
            taxableProfit,
            year:                row.year,
        };
    });
}
