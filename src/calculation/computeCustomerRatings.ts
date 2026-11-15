import type DashboardFilter from '@/calculation/DashboardFilter';
import type DashboardInput from '@/calculation/DashboardInput';
import type DashboardResult from '@/calculation/DashboardResult';
import invoiceAmount from '@/calculation/invoiceAmount';
import isIssued from '@/calculation/isIssued';
import yearOf from '@/calculation/yearOf';

type Rating = DashboardResult['customers'][number]['rating'];

function rate(customer: DashboardInput['customers'][number], result: number, recurring: number, surplus: number, revenue: number): Rating {
    if (customer.channel === 'own_project' || customer.channel === 'internal') {
        return 'own_project';
    }
    if (result < 0) {
        return recurring > 0 && surplus >= 0 ? 'minus_covered' : 'minus';
    }
    if (customer.status === 'inactive' || customer.archived) {
        return 'closed';
    }
    if (customer.status === 'paused') {
        return 'paused';
    }
    if (surplus > 0) {
        return 'worth_it';
    }
    if (revenue > 0) {
        return 'one_time';
    }
    return 'open';
}

/**
 * "Is the customer worth it?" – revenue and costs (in the selected year, otherwise all time) plus the
 * running yearly surplus of recurring charges minus assigned fixed costs and the server share.
 */
export default function computeCustomerRatings(input: DashboardInput, filter: DashboardFilter): DashboardResult['customers'] {
    const serverCosts = input.recurringCosts.filter((cost) => cost.type === 'server').reduce((sum, cost) => sum + cost.costPerYear, 0);
    const hostingCustomers = new Set(input.recurringCharges.filter((charge) => charge.service === 'hosting').map((charge) => charge.customerId));
    const serverShare = input.settings.serverCostAllocation === 'equal_among_hosting_customers' && hostingCustomers.size > 0
                        ? Math.round(serverCosts / hostingCustomers.size)
                        : 0;
    const inYear = (date: string) => filter.year === null || yearOf(date) === filter.year;

    return input.customers
                .filter((customer) => filter.customerId === null || customer.id === filter.customerId)
                .map((customer) => {
                    const revenue = input.invoices
                                         .filter((invoice) => isIssued(invoice) && inYear(invoice.date!))
                                         .reduce((sum, invoice) => sum + invoiceAmount(invoice, customer.id), 0);
                    const costs = input.expenses
                                       .filter((expense) => expense.assignedTo === customer.id && expense.status === 'receipt' && inYear(expense.date))
                                       .reduce((sum, expense) => sum + expense.grossAmount, 0);
                    const recurringPerYear = input.recurringCharges.filter((charge) => charge.customerId === customer.id).reduce((sum, charge) => sum + charge.amountPerYear, 0);
                    const domainsPackagesPerYear = input.recurringCosts
                                                        .filter((cost) => cost.assignedTo === customer.id && cost.type !== 'server')
                                                        .reduce((sum, cost) => sum + cost.costPerYear, 0);
                    const share = hostingCustomers.has(customer.id) ? serverShare : 0;
                    const surplus = recurringPerYear - domainsPackagesPerYear - share;
                    const result = revenue - costs;
                    return {
                        archived:               customer.archived,
                        channel:                customer.channel,
                        costs,
                        customerId:             customer.id,
                        domainsPackagesPerYear,
                        name:                   customer.name,
                        rating:                 rate(customer, result, recurringPerYear, surplus, revenue),
                        recurringPerYear,
                        result,
                        revenue,
                        serverShare:            share,
                        status:                 customer.status,
                        surplus,
                    };
                })
                .toSorted((a, b) => b.result - a.result || a.name.localeCompare(b.name));
}
