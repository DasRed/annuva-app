import type Locale from '@/i18n/Locale';
import type DatabaseConfig from '@/server/config/DatabaseConfig';
import type SmtpConfig from '@/server/config/SmtpConfig';

export default interface AppConfig {
    appMode: 'single' | 'multi';
    appName: string;
    appUrl: string | null;
    authSecret: string | null;
    dataDir: string;
    database: DatabaseConfig;
    defaultLocale: Locale;
    defaultTimezone: string;
    gravatarEnabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    mailFrom: string | null;
    sessionMaxAgeDays: number;
    setupToken: string | null;
    smtp: SmtpConfig | null;
    uploadMaxSize: number;
}
