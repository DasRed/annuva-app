/**
 * Formats an amount in cents with the currency of the tenant.
 */
export default function formatMoney(cents: number | null | undefined, locale = 'de-DE', currency = 'EUR', signed = false): string {
    if (cents === null || cents === undefined || Number.isNaN(cents)) {
        return '–';
    }
    return new Intl.NumberFormat(locale, {currency, signDisplay: signed ? 'exceptZero' : 'auto', style: 'currency'}).format(cents / 100);
}
