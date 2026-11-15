/**
 * Everything printed on an invoice, frozen when the invoice is issued. Later changes to the tenant,
 * customer or template never alter an issued invoice.
 */
export default interface InvoiceSnapshot {
    cancelsNumber: string | null;
    currency: string;
    date: string | null;
    description: string;
    dueDate: string | null;
    gross: number;
    language: 'de' | 'en';
    lines: { description: string; net: number; quantity: number; taxRate: number; unitPrice: number }[];
    locale: string;
    net: number;
    notes: string | null;
    number: string | null;
    recipient: { address: string | null; email: string | null; name: string };
    serviceDateFrom: string | null;
    serviceDateTo: string | null;
    tax: number;
    template: {
        accentColor: string;
        closingText: string | null;
        footerCenter: string | null;
        footerLeft: string | null;
        footerRight: string | null;
        introText: string | null;
        logo: string | null;
        senderLine: string | null;
        /** Scanned signature as data URL; missing in snapshots issued before signatures existed. */
        signature?: string | null;
        signatureName?: string | null;
    };
    tenant: {
        address: string | null;
        bankName: string | null;
        bic: string | null;
        companyName: string;
        email: string | null;
        iban: string | null;
        phone: string | null;
        taxNumber: string | null;
        vatId: string | null;
        website: string | null;
    };
    vatMode: string;
}
