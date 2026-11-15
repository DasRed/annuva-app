import type DashboardInput from '@/calculation/DashboardInput';

/**
 * Amount of an invoice, optionally only the positions of one customer (partner invoices can
 * contain several end customers).
 */
export default function invoiceAmount(invoice: DashboardInput['invoices'][number], customerId: string | null): number {
    return invoice.lines
                  .filter((line) => customerId === null || line.customerId === customerId)
                  .reduce((sum, line) => sum + line.amount, 0);
}
