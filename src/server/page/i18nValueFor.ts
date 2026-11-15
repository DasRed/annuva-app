import getDictionary from '@/i18n/getDictionary';
import type I18nValue from '@/i18n/I18nValue';
import type Locale from '@/i18n/Locale';
import getConfig from '@/server/config/getConfig';
import type PageSession from '@/server/page/PageSession';

/**
 * Builds the i18n value for a page: UI language from the user (or the request), number and date
 * format and currency from the tenant settings.
 */
export default function i18nValueFor(locale: Locale, session: PageSession | null): I18nValue {
    const settings = session?.settings ?? null;
    return {
        currency:     typeof settings?.currency === 'string' ? settings.currency : 'EUR',
        dictionary:   getDictionary(locale),
        formatLocale: typeof settings?.locale === 'string' ? settings.locale : (locale === 'de' ? 'de-DE' : 'en-GB'),
        locale,
        timezone:     session?.user.timezone ?? getConfig().defaultTimezone,
    };
}
