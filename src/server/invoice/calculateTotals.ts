/**
 * Calculates line and invoice totals in cents. Quantities and tax rates are in hundredths
 * (150 = 1.5 hours, 1900 = 19 %). Small businesses (§ 19 UStG) never charge VAT.
 */
export default function calculateTotals(
    lines: ReadonlyArray<{ quantity: number; taxRate: number; unitPrice: number }>,
    vatMode: string,
): { gross: number; lines: { net: number; tax: number }[]; net: number; tax: number } {
    const result = lines.map((line) => {
        const net = Math.round((line.quantity * line.unitPrice) / 100);
        const tax = vatMode === 'regular' ? Math.round((net * line.taxRate) / 10_000) : 0;
        return {net, tax};
    });
    const net = result.reduce((sum, line) => sum + line.net, 0);
    const tax = result.reduce((sum, line) => sum + line.tax, 0);
    return {gross: net + tax, lines: result, net, tax};
}
