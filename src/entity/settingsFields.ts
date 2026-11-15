import type FieldDefinition from '@/entity/FieldDefinition';

/**
 * Business settings of a tenant (company data, invoicing, tax). Stored on the tenant record.
 */
const settingsFields: readonly FieldDefinition[] = [
    {max: 255, name: 'name', required: true, type: 'string'},
    {max: 255, name: 'companyName', type: 'string'},
    {name: 'address', type: 'text'},
    {max: 255, name: 'email', type: 'email'},
    {max: 64, name: 'phone', type: 'string'},
    {max: 255, name: 'website', type: 'string'},
    {max: 64, name: 'taxNumber', type: 'string'},
    {max: 64, name: 'vatId', type: 'string'},
    {max: 255, name: 'bankName', type: 'string'},
    {max: 64, name: 'iban', type: 'string'},
    {max: 32, name: 'bic', type: 'string'},
    {default: 'small_business', name: 'vatMode', options: ['small_business', 'regular'], required: true, type: 'enum'},
    {default: 19, name: 'defaultVatRate', required: true, type: 'percent'},
    {default: 'EUR', max: 3, name: 'currency', required: true, type: 'string'},
    {default: 'de-DE', name: 'locale', options: ['de-DE', 'de-AT', 'de-CH', 'en-GB', 'en-US'], required: true, type: 'enum'},
    {default: 'Europe/Berlin', max: 64, name: 'timezone', required: true, type: 'string'},
    {default: 80, name: 'defaultHourlyRate', required: true, type: 'money'},
    {default: 60, name: 'defaultHostingPerYear', required: true, type: 'money'},
    {default: 'RE-{YYYY}-{NNN}', max: 64, name: 'invoiceNumberFormat', required: true, type: 'string'},
    {default: 1, max: 12, min: 1, name: 'recurringInvoiceMonth', required: true, type: 'integer'},
    {default: 4, max: 12, min: 1, name: 'taxPaymentMonth', required: true, type: 'integer'},
    {default: 'equal_among_hosting_customers', name: 'serverCostAllocation', options: ['equal_among_hosting_customers', 'none'], required: true, type: 'enum'},
    {default: 'at_cost', name: 'domainPassThrough', options: ['at_cost', 'markup'], required: true, type: 'enum'},
];

export default settingsFields;
