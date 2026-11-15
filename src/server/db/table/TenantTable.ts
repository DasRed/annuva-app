export default interface TenantTable {
    address: string | null;
    bankName: string | null;
    bic: string | null;
    companyName: string | null;
    createdAt: string;
    currency: string;
    defaultHostingPerYear: number;
    defaultHourlyRate: number;
    defaultVatRate: number;
    domainPassThrough: string;
    email: string | null;
    iban: string | null;
    id: string;
    invoiceNumberFormat: string;
    locale: string;
    name: string;
    phone: string | null;
    recurringInvoiceMonth: number;
    serverCostAllocation: string;
    setupCompletedAt: string | null;
    taxNumber: string | null;
    taxPaymentMonth: number;
    timezone: string;
    updatedAt: string;
    vatId: string | null;
    vatMode: string;
    website: string | null;
}
