import type DashboardFilter from '@/calculation/DashboardFilter';
import type DashboardInput from '@/calculation/DashboardInput';
import type DashboardResult from '@/calculation/DashboardResult';
import invoiceAmount from '@/calculation/invoiceAmount';
import isIssued from '@/calculation/isIssued';
import yearOf from '@/calculation/yearOf';

/**
 * Revenue and expenses per actual year plus the plan year (last actual year + 1). The plan year only
 * contains recurring charges against fixed costs, without new projects.
 */
export default function computeYears(input: DashboardInput, customerId: DashboardFilter['customerId']): { lastActualYear: number; planYear: number; years: DashboardResult['years'] } {
    const invoices = input.invoices.filter(isIssued).filter((invoice) => invoiceAmount(invoice, customerId) !== 0 || customerId === null);
    const expenses = input.expenses.filter((expense) => customerId === null || expense.assignedTo === customerId);

    const invoiceYears = input.invoices.filter(isIssued).map((invoice) => yearOf(invoice.date!));
    const expenseYears = input.expenses.map((expense) => yearOf(expense.date));
    const lastActualYear = invoiceYears.length > 0 ? Math.max(...invoiceYears) : (expenseYears.length > 0 ? Math.max(...expenseYears) : yearOf(input.today));
    const planYear = lastActualYear + 1;

    const actualYears = [...new Set([...invoiceYears, ...expenseYears])].filter((year) => year <= lastActualYear).toSorted((a, b) => a - b);
    if (actualYears.length === 0) {
        actualYears.push(lastActualYear);
    }

    const years: DashboardResult['years'] = actualYears.map((year) => {
        const revenue = invoices.filter((invoice) => yearOf(invoice.date!) === year).reduce((sum, invoice) => sum + invoiceAmount(invoice, customerId), 0);
        const yearExpenses = expenses.filter((expense) => yearOf(expense.date) === year);
        const total = yearExpenses.reduce((sum, expense) => sum + expense.grossAmount, 0);
        const planned = yearExpenses.filter((expense) => expense.status !== 'receipt').reduce((sum, expense) => sum + expense.grossAmount, 0);
        return {expenses: total, expensesPlanned: planned, plan: false, result: revenue - total, revenue, year};
    });

    const planRevenue = input.recurringCharges
                             .filter((charge) => customerId === null || charge.customerId === customerId)
                             .filter((charge) => yearOf(charge.nextInvoiceDate) === planYear)
                             .reduce((sum, charge) => sum + charge.amountPerYear, 0);
    const planExpenses = input.recurringCosts
                              .filter((cost) => customerId === null || cost.assignedTo === customerId)
                              .reduce((sum, cost) => sum + cost.costPerYear, 0);
    years.push({expenses: planExpenses, expensesPlanned: planExpenses, plan: true, result: planRevenue - planExpenses, revenue: planRevenue, year: planYear});

    return {lastActualYear, planYear, years};
}
