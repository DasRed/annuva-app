import type DashboardFilter from '@/calculation/DashboardFilter';
import type DashboardInput from '@/calculation/DashboardInput';
import type DashboardResult from '@/calculation/DashboardResult';
import invoiceAmount from '@/calculation/invoiceAmount';

/**
 * Key figures for the reference year (selected year, otherwise the last actual year).
 */
export default function computeKpis(
    input: DashboardInput,
    filter: DashboardFilter,
    years: DashboardResult['years'],
    tax: DashboardResult['tax'],
    lastActualYear: number,
): DashboardResult['kpis'] {
    const referenceYear = filter.year ?? lastActualYear;
    const current = years.find((row) => row.year === referenceYear);
    const previous = years.find((row) => row.year === referenceYear - 1 && !row.plan);
    const revenue = current?.revenue ?? 0;
    const expenses = current?.expenses ?? 0;
    const taxRow = filter.customerId === null ? tax.find((row) => row.year === referenceYear) : undefined;
    const taxValue = taxRow?.tax ?? null;
    const actual = years.filter((row) => !row.plan);
    const forCustomer = <T extends { customerId: string | null }>(item: T) => filter.customerId === null || item.customerId === filter.customerId;
    const toIssue = input.invoices.filter((invoice) => invoice.status === 'to_issue');
    const toIssueSum = toIssue.reduce((sum, invoice) => sum + invoiceAmount(invoice, filter.customerId), 0);
    const tasks = input.tasks.filter(forCustomer);

    return {
        afterTax:          taxValue === null ? null : revenue - expenses - taxValue,
        change:            previous === undefined || previous.revenue === 0 ? null : (revenue - previous.revenue) / previous.revenue,
        expenses,
        expensesPlanned:   current?.expensesPlanned ?? 0,
        fixedCostsPerYear: input.recurringCosts.filter((cost) => filter.customerId === null || cost.assignedTo === filter.customerId).reduce((sum, cost) => sum + cost.costPerYear, 0),
        recurringPerYear:  input.recurringCharges.filter(forCustomer).reduce((sum, charge) => sum + charge.amountPerYear, 0),
        referenceYear,
        result:            revenue - expenses,
        resultSinceStart:  actual.reduce((sum, row) => sum + row.revenue - row.expenses, 0),
        revenue,
        serverCoverage:    input.recurringCharges.filter((charge) => charge.service === 'hosting').reduce((sum, charge) => sum + charge.amountPerYear, 0)
                           - input.recurringCosts.filter((cost) => cost.type === 'server').reduce((sum, cost) => sum + cost.costPerYear, 0),
        tasksOpen:         tasks.filter((task) => task.status === 'open').length,
        tasksWaiting:      tasks.filter((task) => task.status === 'waiting_for_go').length,
        tax:               taxValue,
        toIssueCount:      toIssue.filter((invoice) => filter.customerId === null || invoiceAmount(invoice, filter.customerId) !== 0 || invoice.customerId === filter.customerId).length,
        toIssueSum,
    };
}
