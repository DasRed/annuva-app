/**
 * Today as YYYY-MM-DD in the given time zone.
 */
export default function todayIso(timezone = 'Europe/Berlin'): string {
    return new Intl.DateTimeFormat('en-CA', {day: '2-digit', month: '2-digit', timeZone: timezone, year: 'numeric'}).format(new Date());
}
