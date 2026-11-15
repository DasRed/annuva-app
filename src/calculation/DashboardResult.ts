/**
 * Everything the dashboard shows. Amounts in cents.
 */
export default interface DashboardResult {
    cashflow: { balance: number; expenses: number; expensesPlanned: number; income: number; incomePlanned: number; month: string }[];
    costsByAssignment: { cost: number; customerId: string; name: string; rebilled: number; selfBorne: number }[];
    customers: {
        archived: boolean;
        channel: string;
        costs: number;
        customerId: string;
        domainsPackagesPerYear: number;
        name: string;
        rating: 'closed' | 'minus' | 'minus_covered' | 'one_time' | 'open' | 'own_project' | 'paused' | 'worth_it';
        recurringPerYear: number;
        result: number;
        revenue: number;
        serverShare: number;
        status: string;
        surplus: number;
    }[];
    expensePivot: {
        rows: { category: string; total: number; values: Record<number, number> }[];
        total: number;
        totals: Record<number, number>;
        years: number[];
    };
    filter: { customerId: string | null; year: number | null };
    kpis: {
        afterTax: number | null;
        change: number | null;
        expenses: number;
        expensesPlanned: number;
        fixedCostsPerYear: number;
        recurringPerYear: number;
        referenceYear: number;
        result: number;
        resultSinceStart: number;
        revenue: number;
        serverCoverage: number;
        tasksOpen: number;
        tasksWaiting: number;
        tax: number | null;
        toIssueCount: number;
        toIssueSum: number;
    };
    lastActualYear: number;
    planYear: number;
    resources: {
        counts: { container: number; customerId: string; domain: number; name: string; other: number; packageServer: number; proxyHost: number }[];
        items: { customerId: string; customerName: string; id: string; kind: string; location: string | null; name: string }[];
    };
    tasks: { customerId: string | null; customerName: string | null; dueDate: string | null; id: string; note: string | null; status: string; title: string }[];
    tax: {
        adjustments: number;
        afterTax: number | null;
        effectiveYear: number;
        plan: boolean;
        profit: number;
        profitPerAssessment: number | null;
        tax: number | null;
        taxableProfit: number;
        year: number;
    }[];
    upcoming: {
        amount: number;
        archivedCustomer: boolean;
        customers: string[];
        date: string | null;
        kind: 'issue_invoice' | 'planned_cost' | 'recurring_invoice' | 'renewal';
        rebilled: boolean;
        recipient: string;
        refId: string;
        title: string;
    }[];
    years: { expenses: number; expensesPlanned: number; plan: boolean; result: number; revenue: number; year: number }[];
}
