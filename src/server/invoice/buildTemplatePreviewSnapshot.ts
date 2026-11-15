import assertTenant from '@/server/auth/assertTenant';
import type AuthContext from '@/server/auth/AuthContext';
import addDays from '@/server/invoice/addDays';
import addMonths from '@/server/invoice/addMonths';
import calculateTotals from '@/server/invoice/calculateTotals';
import formatInvoiceNumber from '@/server/invoice/formatInvoiceNumber';
import type InvoiceSnapshot from '@/server/invoice/InvoiceSnapshot';
import loadTemplateLogo from '@/server/invoice/loadTemplateLogo';
import snapshotLocale from '@/server/invoice/snapshotLocale';
import snapshotTenant from '@/server/invoice/snapshotTenant';
import todayIso from '@/server/invoice/todayIso';
import TenantService from '@/server/tenant/TenantService';

type TemplateValues = {
    accentColor?: string | null;
    closingText?: string | null;
    footerCenter?: string | null;
    footerLeft?: string | null;
    footerRight?: string | null;
    introText?: string | null;
    logoFileId?: string | null;
    paymentTermDays?: number | null;
    senderLine?: string | null;
};

const samples = {
    de: {
        description: 'Beispielrechnung',
        lines:       [
            {description: 'Webhosting (12 Monate)', quantity: 100, unitPrice: 12_000},
            {description: 'Domain beispiel.de', quantity: 100, unitPrice: 1_500},
            {description: 'Wartung und Updates', quantity: 250, unitPrice: 8_000},
        ],
        recipient:   {address: 'Erika Mustermann\nMusterstraße 1\n12345 Musterstadt', email: null, name: 'Muster GmbH'},
    },
    en: {
        description: 'Sample invoice',
        lines:       [
            {description: 'Web hosting (12 months)', quantity: 100, unitPrice: 12_000},
            {description: 'Domain example.com', quantity: 100, unitPrice: 1_500},
            {description: 'Maintenance and updates', quantity: 250, unitPrice: 8_000},
        ],
        recipient:   {address: 'Jane Doe\n1 Example Street\nLondon EC1A 1AA', email: null, name: 'Example Ltd'},
    },
};

const text = (value: string | null | undefined) => (typeof value === 'string' && value.trim() !== '' ? value : null);

/**
 * A realistic sample invoice with the company data and the given – possibly unsaved – template
 * values, for the live preview of invoice templates.
 */
export default async function buildTemplatePreviewSnapshot(context: AuthContext, values: TemplateValues): Promise<InvoiceSnapshot> {
    const tenant = await new TenantService().getRow(assertTenant(context));
    const language = tenant.locale.startsWith('en') ? 'en' : 'de';
    const sample = samples[language];
    const today = todayIso();
    const taxRate = tenant.vatMode === 'regular' ? tenant.defaultVatRate : 0;
    const lines = sample.lines.map((line) => ({...line, taxRate}));
    const totals = calculateTotals(lines, tenant.vatMode);
    const paymentTermDays = typeof values.paymentTermDays === 'number' && values.paymentTermDays >= 0 ? values.paymentTermDays : 14;

    return {
        cancelsNumber:   null,
        currency:        tenant.currency,
        date:            today,
        description:     sample.description,
        dueDate:         addDays(today, paymentTermDays),
        gross:           totals.gross,
        language,
        lines:           lines.map((line, index) => ({...line, net: totals.lines[index].net})),
        locale:          snapshotLocale(language, tenant.locale),
        net:             totals.net,
        notes:           null,
        number:          formatInvoiceNumber(tenant.invoiceNumberFormat, today, 1),
        recipient:       sample.recipient,
        serviceDateFrom: today,
        serviceDateTo:   addDays(addMonths(today, 12), -1),
        tax:             totals.tax,
        template:        {
            accentColor:  typeof values.accentColor === 'string' && /^#[\da-f]{6}$/i.test(values.accentColor) ? values.accentColor : '#0f6b5c',
            closingText:  text(values.closingText),
            footerCenter: text(values.footerCenter),
            footerLeft:   text(values.footerLeft),
            footerRight:  text(values.footerRight),
            introText:    text(values.introText),
            logo:         await loadTemplateLogo(context, values.logoFileId),
            senderLine:   text(values.senderLine),
        },
        tenant:          snapshotTenant(tenant),
        vatMode:         tenant.vatMode,
    };
}
