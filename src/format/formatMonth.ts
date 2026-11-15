/**
 * Name of a month of the year (1 = January) in the given locale, e.g. 3 → "März".
 */
export default function formatMonth(month: number, locale = 'de'): string {
    return new Intl.DateTimeFormat(locale, {month: 'long', timeZone: 'UTC'}).format(new Date(Date.UTC(2000, month - 1, 1)));
}
