import type {Metadata} from 'next';
import getDictionary from '@/i18n/getDictionary';
import type TranslationKey from '@/i18n/TranslationKey';
import translate from '@/i18n/translate';
import getPageSession from '@/server/page/getPageSession';
import getRequestLocale from '@/server/page/getRequestLocale';

/**
 * Page title in the language of the user.
 */
export default async function pageMetadata(key: TranslationKey): Promise<Metadata> {
    const session = await getPageSession();
    const locale = session?.user.locale ?? await getRequestLocale();
    return {title: translate(getDictionary(locale), key)};
}
