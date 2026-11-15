import {cookies, headers} from 'next/headers';
import type Locale from '@/i18n/Locale';
import locales from '@/i18n/locales';
import getConfig from '@/server/config/getConfig';

/**
 * Language for visitors without session: cookie from the language switch, otherwise the browser
 * language (Accept-Language), otherwise DEFAULT_LOCALE.
 */
export default async function getRequestLocale(): Promise<Locale> {
    const cookie = (await cookies()).get('annuva_locale')?.value;
    if (cookie !== undefined && (locales as readonly string[]).includes(cookie)) {
        return cookie as Locale;
    }
    const accepted = (await headers()).get('accept-language') ?? '';
    for (const part of accepted.split(',')) {
        const language = part.split(';')[0].trim().slice(0, 2).toLowerCase();
        if ((locales as readonly string[]).includes(language)) {
            return language as Locale;
        }
    }
    return getConfig().defaultLocale;
}
