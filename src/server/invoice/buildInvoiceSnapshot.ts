import type {Kysely} from 'kysely';
import recipientAddressLines from '@/address/recipientAddressLines';
import resolveBillingRecipient from '@/address/resolveBillingRecipient';
import type AuthContext from '@/server/auth/AuthContext';
import getDb from '@/server/db/getDb';
import type InvoiceLineTable from '@/server/db/table/InvoiceLineTable';
import calculateTotals from '@/server/invoice/calculateTotals';
import type InvoiceSnapshot from '@/server/invoice/InvoiceSnapshot';
import loadTemplateImage from '@/server/invoice/loadTemplateImage';
import snapshotLocale from '@/server/invoice/snapshotLocale';
import snapshotTenant from '@/server/invoice/snapshotTenant';
import TenantService from '@/server/tenant/TenantService';

type Row = Record<string, any>;

/**
 * Collects all data printed on an invoice: tenant, recipient (customer or partner, with the
 * fallbacks of `resolveBillingRecipient`), template incl. logo, positions and totals.
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

    const logo = await loadTemplateImage(context, template?.logoFileId);
    const language = invoice.language === 'en' ? 'en' : 'de';

    const cancelled = invoice.cancelsInvoiceId === null
                      ? null
                      : await db.selectFrom('invoices').select('number').where('id', '=', invoice.cancelsInvoiceId).executeTakeFirst() as Row | undefined;
    const totals = calculateTotals(lines, tenant.vatMode);
    const recipient = resolveBillingRecipient(partner ?? customer);
    const recipientAddress = recipientAddressLines(recipient, {homeCountry: tenant.country, language});

    return {
        cancelsNumber:   cancelled?.number ?? null,
        currency:        tenant.currency,
        date:            invoice.date,
        description:     invoice.description,
        dueDate:         invoice.dueDate,
        gross:           totals.gross,
        language,
        lines:           lines.map((line, index) => ({
            description: line.description,
            net:         totals.lines[index].net,
            quantity:    line.quantity,
            taxRate:     line.taxRate,
            unitPrice:   line.unitPrice,
        })),
        locale:          snapshotLocale(language, tenant.locale),
        net:             totals.net,
        notes:           invoice.notes,
        number:          invoice.number,
        recipient:       {
            address: recipientAddress.length === 0 ? null : recipientAddress.join('\n'),
            email:   recipient.email,
            name:    recipient.name,
        },
        serviceDateFrom: invoice.serviceDateFrom,
        serviceDateTo:   invoice.serviceDateTo,
        tax:             totals.tax,
        template:        {
            accentColor:   template?.accentColor ?? '#0f6b5c',
            closingText:   template?.closingText ?? null,
            footerCenter:  template?.footerCenter ?? null,
            footerLeft:    template?.footerLeft ?? null,
            footerRight:   template?.footerRight ?? null,
            introText:     template?.introText ?? null,
            logo,
            senderLine:    template?.senderLine ?? null,
            signature:     await loadTemplateImage(context, template?.signatureFileId),
            signatureName: template?.signatureName ?? null,
        },
        tenant:          snapshotTenant(tenant, {language, recipientCountry: recipient.address.country}),
        vatMode:         tenant.vatMode,
    };
}
