'use client';

import {useRouter} from 'next/navigation';
import useI18n from '@/i18n/useI18n';

/**
 * Language switch for visitors without session (stored in a cookie, not in the URL).
 */
export default function LanguageSwitch() {
    const {locale} = useI18n();
    const router = useRouter();
    return (
        <div className="flex gap-1 text-sm" role="group" aria-label="Language">
            {(['de', 'en'] as const).map((value) => (
                <button
                    key={value}
                    type="button"
                    aria-pressed={locale === value}
                    onClick={() => {
                        document.cookie = `annuva_locale=${value}; path=/; max-age=31536000; samesite=lax`;
                        router.refresh();
                    }}
                    className={`rounded-full px-2.5 py-1 uppercase transition ${locale === value ? 'bg-accent text-accent-ink' : 'text-text-muted hover:bg-surface-2'}`}
                >
                    {value}
                </button>
            ))}
        </div>
    );
}
