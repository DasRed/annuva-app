import chargeAmountPerInvoice from '@/calculation/chargeAmountPerInvoice';
import type DashboardFilter from '@/calculation/DashboardFilter';
import type DashboardInput from '@/calculation/DashboardInput';
import type DashboardResult from '@/calculation/DashboardResult';
import invoiceAmount from '@/calculation/invoiceAmount';
import isIssued from '@/calculation/isIssued';

function nextMonth(month: string): string {
    const [year, value] = month.split('-').map(Number);
    return value === 12 ? `${year + 1}-01` : `${year}-${String(value + 1).padStart(2, '0')}`;
}

/**
 * Monthly cash flow without gaps from the first to the last month with data. The balance is
 * cumulative since the start, even when only one year is shown.
 */
export default function computeCashflow(input: DashboardInput, filter: DashboardFilter, tax: DashboardResult['tax']): DashboardResult['cashflow'] {
    const months = new Map<string, Omit<DashboardResult['cashflow'][number], 'balance' | 'month'>>();
    const add = (date: string, key: 'expenses' | 'expensesPlanned' | 'income' | 'incomePlanned', amount: number) => {
        const month = date.slice(0, 7);
        const entry = months.get(month) ?? {expenses: 0, expensesPlanned: 0, income: 0, incomePlanned: 0};
        entry[key] += amount;
        months.set(month, entry);
    };

    for (const invoice of input.invoices.filter(isIssued)) {
        const amount = invoiceAmount(invoice, filter.customerId);
        if (filter.customerId === null || amount !== 0) {
            add(invoice.date!, 'income', amount);
        }
    }
    for (const charge of input.recurringCharges) {
        if (filter.customerId === null || charge.customerId === filter.customerId) {
            add(charge.nextInvoiceDate, 'incomePlanned', chargeAmountPerInvoice(charge.amountPerYear, charge.interval));
        }
    }
    for (const expense of input.expenses) {
        if (filter.customerId === null || expense.assignedTo === filter.customerId) {
            add(expense.date, expense.status === 'receipt' ? 'expenses' : 'expensesPlanned', expense.grossAmount);
        }
    }
    if (filter.customerId === null) {
        const month = String(input.settings.taxPaymentMonth).padStart(2, '0');
        for (const row of tax) {
            if (row.tax !== null && row.tax !== 0) {
                add(`${row.effectiveYear}-${month}-01`, row.profitPerAssessment !== null ? 'expenses' : 'expensesPlanned', row.tax);
            }
        }
    }

    if (months.size === 0) {
        return [];
    }
    const sorted = [...months.keys()].toSorted();
    const result: DashboardResult['cashflow'] = [];
    let balance = 0;
    for (let month = sorted[0]; month <= sorted[sorted.length - 1]; month = nextMonth(month)) {
        const entry = months.get(month) ?? {expenses: 0, expensesPlanned: 0, income: 0, incomePlanned: 0};
        balance += entry.income + entry.incomePlanned - entry.expenses - entry.expensesPlanned;
        result.push({...entry, balance, month});
    }
    return filter.year === null ? result : result.filter((entry) => entry.month.startsWith(`${filter.year}-`));
}
