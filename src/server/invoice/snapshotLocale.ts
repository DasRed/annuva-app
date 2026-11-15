/**
 * Number and date locale of an invoice: the tenant locale when it matches the invoice language,
 * otherwise a sensible default for that language.
 */
export default function snapshotLocale(language: 'de' | 'en', tenantLocale: string): string {
    if (language === 'en') {
        return tenantLocale.startsWith('en') ? tenantLocale : 'en-GB';
    }
    return tenantLocale.startsWith('de') ? tenantLocale : 'de-DE';
}
