import type DashboardInput from '@/calculation/DashboardInput';

/**
 * Issued invoices count as revenue; drafts ("to_issue") never do.
 */
export default function isIssued(invoice: DashboardInput['invoices'][number]): boolean {
    return invoice.status !== 'to_issue' && invoice.date !== null;
}
