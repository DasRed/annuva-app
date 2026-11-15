export default interface BillingRunResult {
    invoices: { id: string }[];
    preview: { charges: number; recipient: string; total: number }[];
    skipped: number;
}
