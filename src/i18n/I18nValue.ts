import type Locale from '@/i18n/Locale';

export default interface I18nValue {
    /** Currency of the tenant, e.g. EUR. */
    currency: string;
    dictionary: Readonly<Record<string, string>>;
    /** Locale for numbers and dates (tenant setting), e.g. de-DE. */
    formatLocale: string;
    /** Language of the UI (user setting). */
    locale: Locale;
    timezone: string;
}
