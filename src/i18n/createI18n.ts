import formatDate from '@/format/formatDate';
import formatMoney from '@/format/formatMoney';
import formatNumber from '@/format/formatNumber';
import type I18nValue from '@/i18n/I18nValue';
import type TranslationKey from '@/i18n/TranslationKey';
import translate from '@/i18n/translate';

/**
 * Translation and formatting helpers for a given i18n value. Used by `useI18n` on the client and
 * directly in server components.
 */
export default function createI18n(value: I18nValue) {
    return {
        ...value,
        date:   (date: string | null | undefined, withTime = false) => formatDate(date, value.formatLocale, withTime),
        money:  (cents: number | null | undefined, signed = false) => formatMoney(cents, value.formatLocale, value.currency, signed),
        number: (number: number | null | undefined, digits = 2) => formatNumber(number, value.formatLocale, digits),
        t:      (key: TranslationKey, params?: Record<string, string | number>) => translate(value.dictionary, key, params),
        /** Translation for dynamic keys (entity fields, enum values); falls back to the given text. */
        td:     (key: string, fallback?: string) => value.dictionary[key] ?? fallback ?? key,
    };
}
