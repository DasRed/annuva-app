import type {Kysely} from 'kysely';
import type AuthContext from '@/server/auth/AuthContext';
import getDb from '@/server/db/getDb';
import type InvoiceLineTable from '@/server/db/table/InvoiceLineTable';
import readStoredFile from '@/server/file/readStoredFile';
import calculateTotals from '@/server/invoice/calculateTotals';
import type InvoiceSnapshot from '@/server/invoice/InvoiceSnapshot';
import TenantService from '@/server/tenant/TenantService';

type Row = Record<string, any>;

/**
 * Collects all data printed on an invoice: tenant, recipient (customer or partner), template incl.
 * logo, positions and totals.
 */
export default async function buildInvoiceSnapshot(context: AuthContext, invoice: Row, lines: InvoiceLineTable[]): Promise<InvoiceSnapshot> {
    const db = (await getDb()) as unknown as Kysely<any>;
    const tenant = await new TenantService().getRow(invoice.tenantId);
    const customer = await db.selectFrom('customers').selectAll().where('id', '=', invoice.customerId).executeTakeFirstOrThrow() as Row;
    const partner = invoice.recipientType === 'partner' && invoice.partnerId !== null
                    ? await db.selectFrom('partners').selectAll().where('id', '=', invoice.partnerId).executeTakeFirst() as Row | undefined
                    : undefined;
    const templateQuery = db.selectFrom('invoiceTemplates').selectAll().where('tenantId', '=', invoice.tenantId);
    const template = (invoice.templateId !== null
                      ? await templateQuery.where('id', '=', invoice.templateId).executeTakeFirst()
                      : await templateQuery.orderBy('isDefault', 'desc').orderBy('createdAt').executeTakeFirst()) as Row | undefined;

    let logo: string | null = null;
    if (template?.logoFileId) {
        try {
            const {content, file} = await readStoredFile(context, template.logoFileId);
            logo = `data:${file.mimeType};base64,${content.toString('base64')}`;
        }
        catch {
            logo = null;
        }
    }

    const cancelled = invoice.cancelsInvoiceId === null
                      ? null
                      : await db.selectFrom('invoices').select('number').where('id', '=', invoice.cancelsInvoiceId).executeTakeFirst() as Row | undefined;
    const totals = calculateTotals(lines, tenant.vatMode);
    const recipient = partner ?? customer;

    return {
        cancelsNumber:   cancelled?.number ?? null,
        currency:        tenant.currency,
        date:            invoice.date,
        description:     invoice.description,
        dueDate:         invoice.dueDate,
        gross:           totals.gross,
        language:        invoice.language === 'en' ? 'en' : 'de',
        lines:           lines.map((line, index) => ({
            description: line.description,
            net:         totals.lines[index].net,
            quantity:    line.quantity,
            taxRate:     line.taxRate,
            unitPrice:   line.unitPrice,
        })),
        locale:          invoice.language === 'en' ? (tenant.locale.startsWith('en') ? tenant.locale : 'en-GB') : (tenant.locale.startsWith('de') ? tenant.locale : 'de-DE'),
        net:             totals.net,
        notes:           invoice.notes,
        number:          invoice.number,
        recipient:       {
            address: [recipient.contactName ?? null, recipient.billingAddress ?? null].filter(Boolean).join('\n') || null,
            email:   recipient.email ?? null,
            name:    recipient.name,
        },
        serviceDateFrom: invoice.serviceDateFrom,
        serviceDateTo:   invoice.serviceDateTo,
        tax:             totals.tax,
        template:        {
            accentColor:  template?.accentColor ?? '#0f6b5c',
            closingText:  template?.closingText ?? null,
            footerCenter: template?.footerCenter ?? null,
            footerLeft:   template?.footerLeft ?? null,
            footerRight:  template?.footerRight ?? null,
            introText:    template?.introText ?? null,
            logo,
            senderLine:   template?.senderLine ?? null,
        },
        tenant:          {
            address:     tenant.address,
            bankName:    tenant.bankName,
            bic:         tenant.bic,
            companyName: tenant.companyName ?? tenant.name,
            email:       tenant.email,
            iban:        tenant.iban,
            phone:       tenant.phone,
            taxNumber:   tenant.taxNumber,
            vatId:       tenant.vatId,
            website:     tenant.website,
        },
        vatMode:         tenant.vatMode,
    };
}
