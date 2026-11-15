import '@fontsource-variable/atkinson-hyperlegible-next';
import '@fontsource-variable/source-serif-4';
import './globals.css';
import type {Metadata, Viewport} from 'next';
import type {ReactNode} from 'react';
import I18nProvider from '@/component/i18n/I18nProvider';
import ThemeScript from '@/component/theme/ThemeScript';
import getConfig from '@/server/config/getConfig';
import getPageSession from '@/server/page/getPageSession';
import getRequestLocale from '@/server/page/getRequestLocale';
import i18nValueFor from '@/server/page/i18nValueFor';

export async function generateMetadata(): Promise<Metadata> {
    const name = getConfig().appName;
    return {
        description: 'Customers, invoices, recurring services and profitability for freelancers.',
        title:       {default: name, template: `%s · ${name}`},
    };
}

export const viewport: Viewport = {
    themeColor: [
        {color: '#faf7f2', media: '(prefers-color-scheme: light)'},
        {color: '#141310', media: '(prefers-color-scheme: dark)'},
    ],
    width:      'device-width',
};

export default async function RootLayout({children}: { children: ReactNode }) {
    const session = await getPageSession();
    const locale = session?.user.locale ?? await getRequestLocale();
    const theme = session?.user.theme ?? 'system';

    return (
        <html lang={locale} data-theme={theme === 'system' ? undefined : theme} data-theme-preference={theme} suppressHydrationWarning>
            <head>
                <ThemeScript/>
            </head>
            <body className="min-h-dvh">
                <I18nProvider value={i18nValueFor(locale, session)}>
                    {children}
                </I18nProvider>
            </body>
        </html>
    );
}
