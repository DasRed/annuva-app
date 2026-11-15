import {type Kysely, sql, type Transaction} from 'kysely';
import {z} from 'zod';
import type EntityRecord from '@/entity/EntityRecord';
import type ListQuery from '@/entity/ListQuery';
import type ListResult from '@/entity/ListResult';
import writeAudit from '@/server/audit/writeAudit';
import assertTenant from '@/server/auth/assertTenant';
import assertWrite from '@/server/auth/assertWrite';
import type AuthContext from '@/server/auth/AuthContext';
import getDb from '@/server/db/getDb';
import type InvoiceLineTable from '@/server/db/table/InvoiceLineTable';
import EntityService from '@/server/entity/EntityService';
import ApiError from '@/server/error/ApiError';
import readStoredFile from '@/server/file/readStoredFile';
import storeFile from '@/server/file/storeFile';
import addDays from '@/server/invoice/addDays';
import buildInvoiceSnapshot from '@/server/invoice/buildInvoiceSnapshot';
import calculateTotals from '@/server/invoice/calculateTotals';
import formatInvoiceNumber from '@/server/invoice/formatInvoiceNumber';
import invoiceInputSchema from '@/server/invoice/invoiceInputSchema';
import type InvoiceSnapshot from '@/server/invoice/InvoiceSnapshot';
import todayIso from '@/server/invoice/todayIso';
import MailService from '@/server/mail/MailService';
import renderInvoicePdf from '@/server/pdf/renderInvoicePdf';
import TenantService from '@/server/tenant/TenantService';
import newId from '@/server/util/newId';
import nowIso from '@/server/util/nowIso';
import parseInput from '@/server/validation/parseInput';

type Row = Record<string, any>;
type Input = z.infer<typeof invoiceInputSchema>;

const issueSchema = z.object({date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()}).strict();
const paidSchema = z.object({paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()}).strict();
const sendSchema = z.object({message: z.string().max(10_000).optional(), to: z.email().optional()}).strict();

/**
 * Invoices with positions. Drafts ("to_issue") are freely editable; issuing assigns the number,
 * freezes all printed data and stores the PDF. Issued invoices never change again – corrections
 * happen through a cancellation invoice.
 */
export default class InvoiceService {
    private readonly entity = new EntityService('invoices');

    async cancel(context: AuthContext, id: string): Promise<EntityRecord> {
        assertWrite(context);
        const invoice = await this.getRow(context, id);
        if (invoice.status === 'to_issue' || invoice.cancelsInvoiceId !== null || invoice.status === 'cancelled') {
            throw ApiError.conflict('invalid_status', 'Only issued invoices can be cancelled.');
        }
        const lines = await this.getLines(invoice.id);
        const now = nowIso();
        const cancellation: Row = {
            ...invoice,
            cancelsInvoiceId: invoice.id,
            createdAt:        now,
            date:             null,
            description:      invoice.description,
            dueDate:          null,
            fileId:           null,
            grossAmount:      -invoice.grossAmount,
            id:               newId(),
            lastReminderAt:   null,
            netAmount:        -invoice.netAmount,
            number:           null,
            paidAt:           null,
            reminderLevel:    0,
            snapshot:         null,
            status:           'to_issue',
            taxAmount:        -invoice.taxAmount,
            updatedAt:        now,
        };
        const db = await this.db();
        await db.transaction().execute(async (trx) => {
            await trx.insertInto('invoices').values(cancellation).execute();
            for (const line of lines) {
                await trx.insertInto('invoiceLines').values({...line, id: newId(), invoiceId: cancellation.id, unitPrice: -line.unitPrice}).execute();
            }
            await trx.updateTable('invoices').set({status: 'cancelled', updatedAt: now}).where('id', '=', invoice.id).execute();
        });
        await writeAudit(context, 'cancel', 'invoices', invoice.id, {cancellationId: cancellation.id});
        const issued = await this.issue(context, cancellation.id, {});
        const db2 = await this.db();
        await db2.updateTable('invoices').set({status: 'cancelled'}).where('id', '=', cancellation.id).execute();
        return {...issued, status: 'cancelled'};
    }

    async create(context: AuthContext, input: unknown): Promise<EntityRecord> {
        assertWrite(context);
        const tenantId = assertTenant(context);
        const data = parseInput(invoiceInputSchema, input);
        const customer = await this.getCustomer(tenantId, data.customerId);
        const now = nowIso();
        const row: Row = {
            cancelsInvoiceId: null,
            createdAt:        now,
            customerId:       data.customerId,
            date:             null,
            description:      data.description,
            dueDate:          data.dueDate ?? null,
            fileId:           null,
            grossAmount:      0,
            id:               newId(),
            language:         data.language ?? customer.language ?? 'de',
            lastReminderAt:   null,
            netAmount:        0,
            notes:            data.notes ?? null,
            number:           null,
            paidAt:           null,
            partnerId:        null,
            recipientType:    'customer',
            reminderLevel:    0,
            serviceDateFrom:  data.serviceDateFrom ?? null,
            serviceDateTo:    data.serviceDateTo ?? null,
            snapshot:         null,
            status:           'to_issue',
            taxAmount:        0,
            templateId:       data.templateId ?? null,
            tenantId,
            updatedAt:        now,
        };
        await this.applyRecipient(tenantId, row, data, customer);
        await this.saveLines(context, row, data.lines, true);
        await writeAudit(context, 'create', 'invoices', row.id, data);
        return this.get(context, row.id);
    }

    async get(context: AuthContext, id: string): Promise<EntityRecord> {
        const invoice = await this.getRow(context, id);
        const lines = await this.getLines(id);
        return {
            ...this.entity.toApi(invoice),
            lines: lines.map((line) => ({
                customerId:  line.customerId,
                description: line.description,
                id:          line.id,
                quantity:    line.quantity / 100,
                taxRate:     line.taxRate / 100,
                unitPrice:   line.unitPrice / 100,
            })),
        };
    }

    async getLines(invoiceId: string): Promise<InvoiceLineTable[]> {
        const db = await getDb();
        return db.selectFrom('invoiceLines').selectAll().where('invoiceId', '=', invoiceId).orderBy('position').execute();
    }

    async getRow(context: AuthContext, id: string): Promise<Row> {
        return this.entity.getRow(context, id);
    }

    async issue(context: AuthContext, id: string, input: unknown): Promise<EntityRecord> {
        assertWrite(context);
        const data = parseInput(issueSchema, input);
        const invoice = await this.getRow(context, id);
        if (invoice.status !== 'to_issue') {
            throw ApiError.conflict('invalid_status', 'The invoice has already been issued.');
        }
        const tenant = await new TenantService().getRow(invoice.tenantId);
        const date = data.date ?? todayIso(tenant.timezone);
        const db = await this.db();
        const template = await db.selectFrom('invoiceTemplates').select('paymentTermDays')
                                 .where('tenantId', '=', invoice.tenantId)
                                 .$if(invoice.templateId !== null, (query) => query.where('id', '=', invoice.templateId))
                                 .orderBy('isDefault', 'desc')
                                 .executeTakeFirst() as Row | undefined;

        const number = await db.transaction().execute(async (trx) => this.nextNumber(trx, invoice.tenantId, tenant.invoiceNumberFormat, date));
        const issued: Row = {
            ...invoice,
            date,
            dueDate:   invoice.cancelsInvoiceId === null ? addDays(date, Number(template?.paymentTermDays ?? 14)) : null,
            number,
            status:    'open',
            updatedAt: nowIso(),
        };
        const lines = await this.getLines(id);
        const snapshot = await buildInvoiceSnapshot(context, issued, lines);
        const pdf = await renderInvoicePdf(snapshot, false);
        const file = await storeFile(context, pdf, `${number}.pdf`, 'application/pdf');
        await db.updateTable('invoices').set({
            date,
            dueDate:   issued.dueDate,
            fileId:    file.id,
            number,
            snapshot:  JSON.stringify(snapshot),
            status:    'open',
            updatedAt: issued.updatedAt,
        }).where('id', '=', id).execute();
        await writeAudit(context, 'issue', 'invoices', id, {number});
        return this.get(context, id);
    }

    async list(context: AuthContext, query: ListQuery): Promise<ListResult> {
        return this.entity.list(context, query);
    }

    async markPaid(context: AuthContext, id: string, input: unknown): Promise<EntityRecord> {
        assertWrite(context);
        const data = parseInput(paidSchema, input);
        const invoice = await this.getRow(context, id);
        if (invoice.status !== 'open') {
            throw ApiError.conflict('invalid_status', 'Only open invoices can be marked as paid.');
        }
        const tenant = await new TenantService().getRow(invoice.tenantId);
        const db = await this.db();
        await db.updateTable('invoices').set({paidAt: data.paidAt ?? todayIso(tenant.timezone), status: 'paid', updatedAt: nowIso()}).where('id', '=', id).execute();
        await writeAudit(context, 'pay', 'invoices', id, data);
        return this.get(context, id);
    }

    async pdf(context: AuthContext, id: string): Promise<{ content: Buffer; filename: string }> {
        const invoice = await this.getRow(context, id);
        if (invoice.fileId !== null) {
            const {content, file} = await readStoredFile(context, invoice.fileId);
            return {content, filename: file.originalName};
        }
        const snapshot = await buildInvoiceSnapshot(context, invoice, await this.getLines(id));
        return {content: await renderInvoicePdf(snapshot, true), filename: `draft-${id.slice(0, 8)}.pdf`};
    }

    async remind(context: AuthContext, id: string, input: unknown): Promise<EntityRecord> {
        const invoice = await this.getRow(context, id);
        if (invoice.status !== 'open') {
            throw ApiError.conflict('invalid_status', 'Reminders can only be sent for open invoices.');
        }
        const level = Number(invoice.reminderLevel) + 1;
        await this.mail(context, invoice, input, level);
        const db = await this.db();
        await db.updateTable('invoices').set({lastReminderAt: nowIso(), reminderLevel: level, updatedAt: nowIso()}).where('id', '=', id).execute();
        await writeAudit(context, 'remind', 'invoices', id, {level});
        return this.get(context, id);
    }

    async remove(context: AuthContext, id: string): Promise<void> {
        assertWrite(context);
        const invoice = await this.getRow(context, id);
        if (invoice.status !== 'to_issue') {
            throw ApiError.conflict('invoice_issued', 'Issued invoices cannot be deleted. Cancel them instead.');
        }
        const db = await this.db();
        await db.transaction().execute(async (trx) => {
            await trx.deleteFrom('invoiceLines').where('invoiceId', '=', id).execute();
            await trx.deleteFrom('invoices').where('id', '=', id).execute();
        });
        await writeAudit(context, 'delete', 'invoices', id);
    }

    async reopen(context: AuthContext, id: string): Promise<EntityRecord> {
        assertWrite(context);
        const invoice = await this.getRow(context, id);
        if (invoice.status !== 'paid' || invoice.cancelsInvoiceId !== null) {
            throw ApiError.conflict('invalid_status', 'Only paid invoices can be reopened.');
        }
        const db = await this.db();
        await db.updateTable('invoices').set({paidAt: null, status: 'open', updatedAt: nowIso()}).where('id', '=', id).execute();
        await writeAudit(context, 'reopen', 'invoices', id);
        return this.get(context, id);
    }

    async send(context: AuthContext, id: string, input: unknown): Promise<EntityRecord> {
        const invoice = await this.getRow(context, id);
        if (invoice.status === 'to_issue') {
            throw ApiError.conflict('invalid_status', 'Issue the invoice before sending it.');
        }
        await this.mail(context, invoice, input, 0);
        await writeAudit(context, 'send', 'invoices', id);
        return this.get(context, id);
    }

    async update(context: AuthContext, id: string, input: unknown): Promise<EntityRecord> {
        assertWrite(context);
        const tenantId = assertTenant(context);
        const existing = await this.getRow(context, id);
        if (existing.status !== 'to_issue') {
            throw ApiError.conflict('invoice_issued', 'Issued invoices cannot be changed. Cancel them and create a new one.');
        }
        const currentLines = await this.getLines(id);
        const data = parseInput(invoiceInputSchema.partial(), input);
        const merged: Input = {
            customerId:      data.customerId ?? existing.customerId,
            description:     data.description ?? existing.description,
            dueDate:         data.dueDate !== undefined ? data.dueDate : existing.dueDate,
            language:        data.language ?? existing.language,
            lines:           data.lines ?? currentLines.map((line) => ({
                customerId:  line.customerId,
                description: line.description,
                quantity:    line.quantity / 100,
                taxRate:     line.taxRate / 100,
                unitPrice:   line.unitPrice / 100,
            })),
            notes:           data.notes !== undefined ? data.notes : existing.notes,
            partnerId:       data.partnerId !== undefined ? data.partnerId : existing.partnerId,
            recipientType:   data.recipientType ?? existing.recipientType,
            serviceDateFrom: data.serviceDateFrom !== undefined ? data.serviceDateFrom : existing.serviceDateFrom,
            serviceDateTo:   data.serviceDateTo !== undefined ? data.serviceDateTo : existing.serviceDateTo,
            templateId:      data.templateId !== undefined ? data.templateId : existing.templateId,
        };
        const customer = await this.getCustomer(tenantId, merged.customerId);
        const row: Row = {
            ...existing,
            customerId:      merged.customerId,
            description:     merged.description,
            dueDate:         merged.dueDate ?? null,
            language:        merged.language,
            notes:           merged.notes ?? null,
            serviceDateFrom: merged.serviceDateFrom ?? null,
            serviceDateTo:   merged.serviceDateTo ?? null,
            templateId:      merged.templateId ?? null,
            updatedAt:       nowIso(),
        };
        await this.applyRecipient(tenantId, row, merged, customer);
        await this.saveLines(context, row, merged.lines, false);
        await writeAudit(context, 'update', 'invoices', id, data);
        return this.get(context, id);
    }

    private async applyRecipient(tenantId: string, row: Row, data: Input, customer: Row): Promise<void> {
        const recipientType = data.recipientType ?? (customer.channel === 'partner' ? 'partner' : 'customer');
        row.recipientType = recipientType;
        row.partnerId = recipientType === 'partner' ? (data.partnerId ?? customer.partnerId ?? null) : null;
        if (recipientType === 'partner' && row.partnerId === null) {
            throw ApiError.badRequest('partner_required', 'Invoices to a partner need a partner.', [{field: 'partnerId', message: 'required'}]);
        }
        const db = await this.db();
        if (row.partnerId !== null) {
            const partner = await db.selectFrom('partners').select('id').where('tenantId', '=', tenantId).where('id', '=', row.partnerId).executeTakeFirst();
            if (partner === undefined) {
                throw ApiError.badRequest('invalid_reference', 'Unknown partner.', [{field: 'partnerId', message: 'unknown'}]);
            }
        }
        if (row.templateId !== null) {
            const template = await db.selectFrom('invoiceTemplates').select('id').where('tenantId', '=', tenantId).where('id', '=', row.templateId).executeTakeFirst();
            if (template === undefined) {
                throw ApiError.badRequest('invalid_reference', 'Unknown template.', [{field: 'templateId', message: 'unknown'}]);
            }
        }
    }

    private async db(): Promise<Kysely<any>> {
        return (await getDb()) as unknown as Kysely<any>;
    }

    private async getCustomer(tenantId: string, customerId: string): Promise<Row> {
        const db = await this.db();
        const customer = await db.selectFrom('customers').selectAll().where('tenantId', '=', tenantId).where('id', '=', customerId).executeTakeFirst();
        if (customer === undefined) {
            throw ApiError.badRequest('invalid_reference', 'Unknown customer.', [{field: 'customerId', message: 'unknown'}]);
        }
        return customer;
    }

    private async mail(context: AuthContext, invoice: Row, input: unknown, reminderLevel: number): Promise<void> {
        assertWrite(context);
        const data = parseInput(sendSchema, input);
        const snapshot = JSON.parse(invoice.snapshot) as InvoiceSnapshot;
        const to = data.to ?? snapshot.recipient.email;
        if (to === null || to === undefined) {
            throw ApiError.badRequest('recipient_email_missing', 'The recipient has no e-mail address.', [{field: 'to', message: 'required'}]);
        }
        const {content, filename} = await this.pdf(context, invoice.id);
        const german = snapshot.language === 'de';
        const amount = new Intl.NumberFormat(snapshot.locale, {currency: snapshot.currency, style: 'currency'}).format(snapshot.gross / 100);
        const subject = reminderLevel > 0
                        ? (german ? `Zahlungserinnerung: Rechnung ${snapshot.number}` : `Payment reminder: invoice ${snapshot.number}`)
                        : (german ? `Rechnung ${snapshot.number}` : `Invoice ${snapshot.number}`);
        const defaultText = reminderLevel > 0
                            ? (german
                               ? `Guten Tag,\n\nzu unserer Rechnung ${snapshot.number} über ${amount} konnten wir noch keinen Zahlungseingang feststellen. Wir bitten um Begleichung. Sollte sich die Zahlung überschnitten haben, betrachten Sie diese Nachricht bitte als gegenstandslos.\n\nMit freundlichen Grüßen\n${snapshot.tenant.companyName}`
                               : `Hello,\n\nwe have not yet received payment for invoice ${snapshot.number} (${amount}). Please settle the amount at your earliest convenience. If you have already paid, please disregard this message.\n\nKind regards\n${snapshot.tenant.companyName}`)
                            : (german
                               ? `Guten Tag,\n\nanbei erhalten Sie die Rechnung ${snapshot.number} über ${amount}.\n\nMit freundlichen Grüßen\n${snapshot.tenant.companyName}`
                               : `Hello,\n\nplease find attached invoice ${snapshot.number} (${amount}).\n\nKind regards\n${snapshot.tenant.companyName}`);
        await new MailService().send({
            attachments: [{content, contentType: 'application/pdf', filename}],
            fromName:    snapshot.tenant.companyName,
            replyTo:     snapshot.tenant.email,
            subject,
            text:        data.message ?? defaultText,
            to,
        });
    }

    private async nextNumber(trx: Transaction<any>, tenantId: string, format: string, date: string): Promise<string> {
        const year = Number(date.slice(0, 4));
        const updated = await trx.updateTable('invoiceSequences')
                                 .set({value: sql`value + 1`})
                                 .where('tenantId', '=', tenantId)
                                 .where('year', '=', year)
                                 .executeTakeFirst();
        if (Number(updated.numUpdatedRows) === 0) {
            await trx.insertInto('invoiceSequences').values({tenantId, value: 1, year}).execute();
        }
        const sequence = await trx.selectFrom('invoiceSequences').select('value').where('tenantId', '=', tenantId).where('year', '=', year).executeTakeFirstOrThrow();
        return formatInvoiceNumber(format, date, Number(sequence.value));
    }

    private async saveLines(context: AuthContext, row: Row, lines: Input['lines'], insert: boolean): Promise<void> {
        const tenantId = assertTenant(context);
        const tenant = await new TenantService().getRow(tenantId);
        const db = await this.db();
        const lineRows: InvoiceLineTable[] = [];
        for (const [index, line] of lines.entries()) {
            const customerId = line.customerId ?? row.customerId;
            if (customerId !== row.customerId) {
                await this.getCustomer(tenantId, customerId);
            }
            lineRows.push({
                customerId,
                description: line.description,
                id:          newId(),
                invoiceId:   row.id,
                position:    index + 1,
                quantity:    Math.round((line.quantity ?? 1) * 100),
                taxRate:     tenant.vatMode === 'regular' ? Math.round((line.taxRate ?? tenant.defaultVatRate / 100) * 100) : 0,
                tenantId,
                unitPrice:   Math.round(line.unitPrice * 100),
            });
        }
        const totals = calculateTotals(lineRows, tenant.vatMode);
        row.netAmount = totals.net;
        row.taxAmount = totals.tax;
        row.grossAmount = totals.gross;
        await db.transaction().execute(async (trx) => {
            if (insert) {
                await trx.insertInto('invoices').values(row).execute();
            }
            else {
                const {id, tenantId: _tenantId, createdAt: _createdAt, ...changes} = row;
                await trx.updateTable('invoices').set(changes).where('id', '=', id).execute();
                await trx.deleteFrom('invoiceLines').where('invoiceId', '=', id).execute();
            }
            for (const line of lineRows) {
                await trx.insertInto('invoiceLines').values(line).execute();
            }
        });
    }
}
