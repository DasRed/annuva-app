import type Locale from '@/i18n/Locale';
import de from '@/translations/de/index';
import en from '@/translations/en/index';

export default function getDictionary(locale: Locale): Readonly<Record<string, string>> {
    return locale === 'de' ? de : en;
}
