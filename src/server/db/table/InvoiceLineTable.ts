export default interface InvoiceLineTable {
    customerId: string;
    description: string;
    id: string;
    invoiceId: string;
    position: number;
    quantity: number;
    taxRate: number;
    tenantId: string;
    unitPrice: number;
}
