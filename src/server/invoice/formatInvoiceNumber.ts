/**
 * Renders an invoice number from a format like "RE-{YYYY}-{NNN}". Supported placeholders: {YYYY},
 * {YY}, {MM} and a counter {N…} that is zero-padded to the number of N.
 */
export default function formatInvoiceNumber(format: string, date: string, counter: number): string {
    const [year, month] = date.split('-');
    return format
        .replaceAll('{YYYY}', year)
        .replaceAll('{YY}', year.slice(2))
        .replaceAll('{MM}', month)
        .replace(/\{(N+)\}/g, (match, digits: string) => String(counter).padStart(digits.length, '0'));
}
