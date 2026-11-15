import type {ReactNode} from 'react';
import LanguageSwitch from '@/component/auth/LanguageSwitch';
import BrandMark from '@/component/layout/BrandMark';
import getDictionary from '@/i18n/getDictionary';
import translate from '@/i18n/translate';
import getConfig from '@/server/config/getConfig';
import getRequestLocale from '@/server/page/getRequestLocale';

export const dynamic = 'force-dynamic';

/**
 * Frame for login, registration, password reset and setup: brand moment on the left (large
 * screens), the form on the right.
 */
export default async function AuthLayout({children}: { children: ReactNode }) {
    const name = getConfig().appName;
    const dictionary = getDictionary(await getRequestLocale());
    const t = (key: string) => translate(dictionary, key);
    return (
        <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <aside className="relative hidden overflow-hidden bg-[#0b3f37] p-12 text-[#faf7f2] lg:flex lg:flex-col lg:justify-between">
                <span className="text-[#faf7f2] [&_span]:text-[#faf7f2]"><BrandMark name={name}/></span>
                <div className="animate-rise relative z-10">
                    <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-[#e8d5a3] uppercase">{t('auth.tagline.eyebrow')}</p>
                    <p className="font-serif text-5xl leading-[1.05] font-semibold">{t('auth.tagline.text')}<br/><span className="text-[#e8d5a3]">{t('auth.tagline.text2')}</span></p>
                </div>
                <svg className="pointer-events-none absolute -right-40 -bottom-40 opacity-20" width="560" height="560" viewBox="0 0 32 32" aria-hidden>
                    <circle cx="16" cy="16" r="12" fill="none" stroke="#e8d5a3" strokeWidth="1.2" strokeDasharray="56 20" transform="rotate(-70 16 16)"/>
                    <circle cx="16" cy="16" r="8" fill="none" stroke="#faf7f2" strokeWidth="0.4"/>
                </svg>
            </aside>
            <main className="flex flex-col px-4 py-6 sm:px-10">
                <div className="flex items-center justify-between">
                    <span className="lg:invisible"><BrandMark name={name}/></span>
                    <LanguageSwitch/>
                </div>
                <div className="flex flex-1 items-center justify-center py-10">
                    <div className="animate-rise w-full max-w-xl">{children}</div>
                </div>
            </main>
        </div>
    );
}
