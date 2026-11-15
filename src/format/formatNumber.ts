export default function formatNumber(value: number | null | undefined, locale = 'de-DE', maximumFractionDigits = 2): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '–';
    }
    return new Intl.NumberFormat(locale, {maximumFractionDigits}).format(value);
}
