/**
 * Formats an amount in cents compactly for axis labels (e.g. "1.2K").
 */
export default function formatCompact(cents: number): string {
    return new Intl.NumberFormat(undefined, {maximumFractionDigits: 1, notation: 'compact'}).format(cents / 100);
}
