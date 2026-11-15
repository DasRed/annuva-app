import type {Kysely} from 'kysely';
import computeDashboard from '@/calculation/computeDashboard';
import type DashboardInput from '@/calculation/DashboardInput';
import type DashboardResult from '@/calculation/DashboardResult';
import assertTenant from '@/server/auth/assertTenant';
import type AuthContext from '@/server/auth/AuthContext';
import getDb from '@/server/db/getDb';
import todayIso from '@/server/invoice/todayIso';
import TenantService from '@/server/tenant/TenantService';

type Row = Record<string, any>;

/**
 * Loads the business data of the tenant and runs the pure dashboard calculation.
 */
export default class DashboardService {
    async get(context: AuthContext, filter: { customerId?: string | null; year?: number | null }): Promise<DashboardResult> {
        const input = await this.load(context);
        return computeDashboard(input, {customerId: filter.customerId ?? null, year: filter.year ?? null});
    }

    async load(context: AuthContext): Promise<DashboardInput> {
        const tenantId = assertTenant(context);
        const tenant = await new TenantService().getRow(tenantId);
        const db = (await getDb()) as unknown as Kysely<any>;
        const all = (table: string) => db.selectFrom(table).selectAll().where('tenantId', '=', tenantId).execute() as Promise<Row[]>;

        const [customers, partners, invoices, lines, expenses, charges, costs, tasks, resources, taxYears, taxAdjustments] = await Promise.all([
            all('customers'), all('partners'), all('invoices'), all('invoiceLines'), all('expenses'), all('recurringCharges'), all('recurringCosts'),
            all('tasks'), all('resources'), all('taxYears'), all('taxAdjustments'),
        ]);

        const linesByInvoice = new Map<string, { amount: number; customerId: string }[]>();
        for (const line of lines) {
            const amount = Math.round((Number(line.quantity) * Number(line.unitPrice)) / 100);
            linesByInvoice.set(line.invoiceId, [...(linesByInvoice.get(line.invoiceId) ?? []), {amount, customerId: line.customerId}]);
        }

        return {
            customers:        customers.map((row) => ({archived: row.archivedAt !== null, channel: row.channel, id: row.id, name: row.name, partnerId: row.partnerId, status: row.status})),
            expenses:         expenses.map((row) => ({
                assignedTo:  row.assignedTo,
                category:    row.category,
                date:        row.date,
                grossAmount: Number(row.grossAmount),
                id:          row.id,
                item:        row.item,
                status:      row.status,
                vendor:      row.vendor,
            })),
            invoices:         invoices.map((row) => ({
                customerId:    row.customerId,
                date:          row.date,
                description:   row.description,
                dueDate:       row.dueDate,
                id:            row.id,
                lines:         linesByInvoice.get(row.id) ?? [],
                number:        row.number,
                partnerId:     row.partnerId,
                recipientType: row.recipientType,
                status:        row.status,
            })),
            partners:         partners.map((row) => ({id: row.id, name: row.name})),
            recurringCharges: charges.map((row) => ({
                amountPerYear:   Number(row.amountPerYear),
                customerId:      row.customerId,
                description:     row.description,
                id:              row.id,
                interval:        row.interval,
                nextInvoiceDate: row.nextInvoiceDate,
                service:         row.service,
            })),
            recurringCosts:   costs.map((row) => ({
                assignedTo:      row.assignedTo,
                costPerYear:     Number(row.costPerYear),
                id:              row.id,
                name:            row.name,
                nextRenewal:     row.nextRenewal,
                provider:        row.provider,
                rebilledPerYear: Number(row.rebilledPerYear),
                type:            row.type,
            })),
            resources:        resources.map((row) => ({customerId: row.customerId, id: row.id, kind: row.kind, location: row.location, name: row.name})),
            settings:         {serverCostAllocation: tenant.serverCostAllocation, taxPaymentMonth: tenant.taxPaymentMonth},
            tasks:            tasks.map((row) => ({customerId: row.customerId, dueDate: row.dueDate, id: row.id, note: row.note, status: row.status, title: row.title})),
            taxAdjustments:   taxAdjustments.map((row) => ({description: row.description, profitAdjustment: Number(row.profitAdjustment), year: Number(row.year)})),
            taxYears:         taxYears.map((row) => ({
                marginalRatePercent: row.marginalRatePercent === null ? null : Number(row.marginalRatePercent),
                profitPerAssessment: row.profitPerAssessment === null ? null : Number(row.profitPerAssessment),
                year:                Number(row.year),
            })),
            today:            todayIso(tenant.timezone),
        };
    }
}
