import type DashboardFilter from '@/calculation/DashboardFilter';
import type DashboardInput from '@/calculation/DashboardInput';
import type DashboardResult from '@/calculation/DashboardResult';
import yearOf from '@/calculation/yearOf';

/**
 * Expenses by category and year, including planned and expected costs.
 */
export default function computeExpensePivot(input: DashboardInput, filter: DashboardFilter): DashboardResult['expensePivot'] {
    const expenses = input.expenses.filter((expense) => filter.customerId === null || expense.assignedTo === filter.customerId);
    const years = [...new Set(expenses.map((expense) => yearOf(expense.date)))].toSorted((a, b) => a - b);
    const categories = [...new Set(expenses.map((expense) => expense.category))].toSorted();
    const rows = categories.map((category) => {
        const values: Record<number, number> = {};
        for (const year of years) {
            values[year] = expenses.filter((expense) => expense.category === category && yearOf(expense.date) === year).reduce((sum, expense) => sum + expense.grossAmount, 0);
        }
        return {category, total: Object.values(values).reduce((sum, value) => sum + value, 0), values};
    }).toSorted((a, b) => b.total - a.total);
    const totals: Record<number, number> = {};
    for (const year of years) {
        totals[year] = rows.reduce((sum, row) => sum + row.values[year], 0);
    }
    return {rows, total: rows.reduce((sum, row) => sum + row.total, 0), totals, years};
}
