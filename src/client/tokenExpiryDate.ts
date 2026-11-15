/**
 * Expiry date (YYYY-MM-DD) for a token validity option, counted from today; null = no expiry.
 * "custom" returns the chosen date as it is.
 */
export default function tokenExpiryDate(validity: string, customDate: string, today: string): string | null {
    const [year, month, day] = today.split('-').map(Number);
    switch (validity) {
        case '30d':
            return new Date(Date.UTC(year, month - 1, day + 30)).toISOString().slice(0, 10);
        case '90d':
            return new Date(Date.UTC(year, month - 1, day + 90)).toISOString().slice(0, 10);
        case '1y':
            return new Date(Date.UTC(year + 1, month - 1, day)).toISOString().slice(0, 10);
        case 'custom':
            return customDate === '' ? null : customDate;
        default:
            return null;
    }
}
