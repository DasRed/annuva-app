/**
 * Formats an ISO date (YYYY-MM-DD) or timestamp for display.
 */
export default function formatDate(value: string | null | undefined, locale = 'de-DE', withTime = false): string {
    if (value === null || value === undefined || value === '') {
        return '–';
    }
    const date = value.length === 10 ? new Date(`${value}T00:00:00Z`) : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat(locale, {
        day:      '2-digit',
        hour:     withTime ? '2-digit' : undefined,
        minute:   withTime ? '2-digit' : undefined,
        month:    '2-digit',
        timeZone: value.length === 10 ? 'UTC' : undefined,
        year:     'numeric',
    }).format(date);
}
