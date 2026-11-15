export default interface InvoiceLineInput {
    customerId?: string | null;
    description: string;
    quantity: number;
    taxRate?: number | null;
    unitPrice: number;
}
