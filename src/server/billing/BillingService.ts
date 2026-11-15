import type {Kysely} from 'kysely';
import {z} from 'zod';
import type EntityRecord from '@/entity/EntityRecord';
import writeAudit from '@/server/audit/writeAudit';
import assertTenant from '@/server/auth/assertTenant';
import assertWrite from '@/server/auth/assertWrite';
import type AuthContext from '@/server/auth/AuthContext';
import buildChargeTitle from '@/server/billing/buildChargeTitle';
import getDb from '@/server/db/getDb';
import addDays from '@/server/invoice/addDays';
import addMonths from '@/server/invoice/addMonths';
import InvoiceService from '@/server/invoice/InvoiceService';
import todayIso from '@/server/invoice/todayIso';
import TenantService from '@/server/tenant/TenantService';
import nowIso from '@/server/util/nowIso';
import parseInput from '@/server/validation/parseInput';

type Row = Record<string, any>;

const runSchema = z.object({
    dryRun: z.boolean().default(false),
    until:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

const intervalMonths: Record<string, number> = {monthly: 1, quarterly: 3, yearly: 12};

const serviceLabels: Record<string, Record<string, string>> = {
    de: {domain: 'Domain', hosting: 'Hosting', maintenance: 'Wartung', other: 'Leistung', package: 'Paket'},
    en: {domain: 'Domain', hosting: 'Hosting', maintenance: 'Maintenance', other: 'Service', package: 'Package'},
};

/**
 * Recurring billing run: turns due recurring charges into draft invoices, grouped by recipient
 * (the partner for partner customers, otherwise the customer), and moves the next invoice date on
 * by one interval. Charges marked "starts after setup" skip their first period.
 */
/**
 * Dates in line texts follow the invoice language: 01.11.2026 or 2026-11-01.
 */
function formatPeriodDate(value: string, language: 'de' | 'en'): string {
    return language === 'de' ? value.split('-').toReversed().join('.') : value;
}

export default class BillingService {
    async run(context: AuthContext, input: unknown): Promise<{ invoices: EntityRecord[]; preview: { charges: number; recipient: string; total: number }[]; skipped: number }> {
        assertWrite(context);
        const tenantId = assertTenant(context);
        const data = parseInput(runSchema, input);
        const tenant = await new TenantService().getRow(tenantId);
        const until = data.until ?? todayIso(tenant.timezone);
        const db = (await getDb()) as unknown as Kysely<any>;

        const charges = await db.selectFrom('recurringCharges')
                                .innerJoin('customers', 'customers.id', 'recurringCharges.customerId')
                                .selectAll('recurringCharges')
                                .select(['customers.name as customerName', 'customers.channel as channel', 'customers.partnerId as partnerId', 'customers.language as language'])
                                .where('recurringCharges.tenantId', '=', tenantId)
                                .where('recurringCharges.nextInvoiceDate', '<=', until)
                                .where('customers.archivedAt', 'is', null)
                                .orderBy('recurringCharges.nextInvoiceDate')
                                .execute() as Row[];

        const groups = new Map<string, Row[]>();
        let skipped = 0;
        for (const charge of charges) {
            if (charge.startsAfterSetup === 1) {
                skipped += 1;
                if (!data.dryRun) {
                    await db.updateTable('recurringCharges')
                            .set({nextInvoiceDate: addMonths(charge.nextInvoiceDate, intervalMonths[charge.interval] ?? 12), startsAfterSetup: 0, updatedAt: nowIso()})
                            .where('id', '=', charge.id)
                            .execute();
                }
                continue;
            }
            const key = charge.channel === 'partner' && charge.partnerId !== null ? `partner:${charge.partnerId}` : `customer:${charge.customerId}`;
            groups.set(key, [...(groups.get(key) ?? []), charge]);
        }

        const preview: { charges: number; recipient: string; total: number }[] = [];
        const invoices: EntityRecord[] = [];
        const invoiceService = new InvoiceService();
        for (const [key, group] of groups) {
            const language = group[0].language === 'en' ? 'en' : 'de';
            const lines = group.map((charge) => {
                const months = intervalMonths[charge.interval] ?? 12;
                const from = charge.nextInvoiceDate as string;
                const to = addDays(addMonths(from, months), -1);
                const label = serviceLabels[language][charge.service] ?? charge.service;
                const customerSuffix = key.startsWith('partner:') ? ` – ${charge.customerName}` : '';
                return {
                    customerId:  charge.customerId as string,
                    description: `${buildChargeTitle(label, charge.description)}${customerSuffix} (${formatPeriodDate(from, language)} – ${formatPeriodDate(to, language)})`.slice(0, 255),
                    quantity:    1,
                    unitPrice:   Math.round((charge.amountPerYear * months) / 12) / 100,
                };
            });
            const total = lines.reduce((sum, line) => sum + Math.round(line.unitPrice * 100), 0);
            preview.push({charges: group.length, recipient: key, total: total / 100});
            if (data.dryRun) {
                continue;
            }
            const periodStart = group.map((charge) => charge.nextInvoiceDate as string).toSorted()[0];
            const invoice = await invoiceService.create(context, {
                customerId:      group[0].customerId,
                description:     language === 'de' ? 'Wiederkehrende Leistungen' : 'Recurring services',
                language,
                lines,
                recipientType:   key.startsWith('partner:') ? 'partner' : 'customer',
                serviceDateFrom: periodStart,
            });
            invoices.push(invoice);
            for (const charge of group) {
                await db.updateTable('recurringCharges')
                        .set({nextInvoiceDate: addMonths(charge.nextInvoiceDate, intervalMonths[charge.interval] ?? 12), updatedAt: nowIso()})
                        .where('id', '=', charge.id)
                        .execute();
            }
        }
        if (!data.dryRun) {
            await writeAudit(context, 'billing_run', 'invoices', null, {invoices: invoices.length, skipped, until});
        }
        return {invoices, preview, skipped};
    }
}
