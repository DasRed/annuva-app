import chargeAmountPerInvoice from '@/calculation/chargeAmountPerInvoice';
import type DashboardFilter from '@/calculation/DashboardFilter';
import type DashboardInput from '@/calculation/DashboardInput';
import type DashboardResult from '@/calculation/DashboardResult';
import invoiceAmount from '@/calculation/invoiceAmount';

type Item = DashboardResult['upcoming'][number];

/**
 * Everything that is due: invoices to issue, recurring invoices (grouped by date and recipient),
 * planned or expected costs and renewals of fixed costs. Items without date come first.
 */
export default function computeUpcoming(input: DashboardInput, filter: DashboardFilter): DashboardResult['upcoming'] {
    const customers = new Map(input.customers.map((customer) => [customer.id, customer]));
    const partners = new Map(input.partners.map((partner) => [partner.id, partner.name]));
    const customerName = (id: string) => customers.get(id)?.name ?? '?';
    const items: Item[] = [];

    for (const invoice of input.invoices.filter((candidate) => candidate.status === 'to_issue')) {
        const lineCustomers = [...new Set([invoice.customerId, ...invoice.lines.map((line) => line.customerId)])];
        if (filter.customerId !== null && !lineCustomers.includes(filter.customerId)) {
            continue;
        }
        items.push({
            amount:           invoiceAmount(invoice, filter.customerId),
            archivedCustomer: false,
            customers:        lineCustomers.map(customerName),
            date:             invoice.dueDate,
            kind:             'issue_invoice',
            rebilled:         false,
            recipient:        invoice.recipientType === 'partner' && invoice.partnerId !== null ? (partners.get(invoice.partnerId) ?? '?') : customerName(invoice.customerId),
            refId:            invoice.id,
            title:            invoice.description,
        });
    }

    const groups = new Map<string, { charges: DashboardInput['recurringCharges']; date: string; recipient: string }>();
    for (const charge of input.recurringCharges) {
        const customer = customers.get(charge.customerId);
        if (customer === undefined || customer.archived) {
            continue;
        }
        const viaPartner = customer.channel === 'partner' && customer.partnerId !== null;
        const recipient = viaPartner ? (partners.get(customer.partnerId!) ?? '?') : customer.name;
        const key = `${charge.nextInvoiceDate}|${viaPartner ? `p:${customer.partnerId}` : `c:${customer.id}`}`;
        const group = groups.get(key) ?? {charges: [], date: charge.nextInvoiceDate, recipient};
        group.charges.push(charge);
        groups.set(key, group);
    }
    for (const [key, group] of groups) {
        const relevant = group.charges.filter((charge) => filter.customerId === null || charge.customerId === filter.customerId);
        if (relevant.length === 0) {
            continue;
        }
        items.push({
            amount:           relevant.reduce((sum, charge) => sum + chargeAmountPerInvoice(charge.amountPerYear, charge.interval), 0),
            archivedCustomer: false,
            customers:        [...new Set(group.charges.map((charge) => customerName(charge.customerId)))],
            date:             group.date,
            kind:             'recurring_invoice',
            rebilled:         false,
            recipient:        group.recipient,
            refId:            key,
            title:            [...new Set(relevant.map((charge) => charge.service))].join(', '),
        });
    }

    const plannedCosts = input.expenses.filter((expense) => expense.status !== 'receipt');
    for (const expense of plannedCosts) {
        if (filter.customerId !== null && expense.assignedTo !== filter.customerId) {
            continue;
        }
        items.push({
            amount:           -expense.grossAmount,
            archivedCustomer: customers.get(expense.assignedTo)?.archived ?? false,
            customers:        [customerName(expense.assignedTo)],
            date:             expense.date,
            kind:             'planned_cost',
            rebilled:         false,
            recipient:        expense.vendor,
            refId:            expense.id,
            title:            expense.item,
        });
    }

    for (const cost of input.recurringCosts) {
        if (cost.nextRenewal === null || (filter.customerId !== null && cost.assignedTo !== filter.customerId)) {
            continue;
        }
        const alreadyPlanned = plannedCosts.some((expense) => expense.date === cost.nextRenewal && expense.assignedTo === cost.assignedTo);
        if (alreadyPlanned) {
            continue;
        }
        items.push({
            amount:           -cost.costPerYear,
            archivedCustomer: customers.get(cost.assignedTo)?.archived ?? false,
            customers:        [customerName(cost.assignedTo)],
            date:             cost.nextRenewal,
            kind:             'renewal',
            rebilled:         cost.rebilledPerYear > 0,
            recipient:        cost.provider,
            refId:            cost.id,
            title:            cost.name,
        });
    }

    return items
        .filter((item) => filter.year === null || item.date === null || item.date.startsWith(`${filter.year}-`))
        .toSorted((a, b) => (a.date === null ? -1 : b.date === null ? 1 : a.date.localeCompare(b.date)));
}
