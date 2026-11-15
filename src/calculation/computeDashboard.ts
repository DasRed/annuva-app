import computeCashflow from '@/calculation/computeCashflow';
import computeCostsByAssignment from '@/calculation/computeCostsByAssignment';
import computeCustomerRatings from '@/calculation/computeCustomerRatings';
import computeExpensePivot from '@/calculation/computeExpensePivot';
import computeKpis from '@/calculation/computeKpis';
import computeResources from '@/calculation/computeResources';
import computeTax from '@/calculation/computeTax';
import computeUpcoming from '@/calculation/computeUpcoming';
import computeYears from '@/calculation/computeYears';
import type DashboardFilter from '@/calculation/DashboardFilter';
import type DashboardInput from '@/calculation/DashboardInput';
import type DashboardResult from '@/calculation/DashboardResult';

const taskOrder: Record<string, number> = {done: 2, open: 0, waiting_for_go: 1};

/**
 * Computes the complete dashboard. Pure function: same input, same output – used by UI, API and MCP.
 */
export default function computeDashboard(input: DashboardInput, filter: DashboardFilter): DashboardResult {
    const filtered = computeYears(input, filter.customerId);
    const unfiltered = filter.customerId === null ? filtered : computeYears(input, null);
    const tax = computeTax(input, unfiltered.years);
    const names = new Map(input.customers.map((customer) => [customer.id, customer.name]));

    return {
        cashflow:          computeCashflow(input, filter, tax),
        costsByAssignment: computeCostsByAssignment(input, filter),
        customers:         computeCustomerRatings(input, filter),
        expensePivot:      computeExpensePivot(input, filter),
        filter,
        kpis:              computeKpis(input, filter, filtered.years, tax, filtered.lastActualYear),
        lastActualYear:    filtered.lastActualYear,
        planYear:          filtered.planYear,
        resources:         computeResources(input, filter),
        tasks:             input.tasks
                                .filter((task) => filter.customerId === null || task.customerId === filter.customerId)
                                .map((task) => ({...task, customerName: task.customerId === null ? null : (names.get(task.customerId) ?? null)}))
                                .toSorted((a, b) => (taskOrder[a.status] ?? 0) - (taskOrder[b.status] ?? 0) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')),
        tax,
        upcoming:          computeUpcoming(input, filter),
        years:             filtered.years,
    };
}
