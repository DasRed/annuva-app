import path from 'node:path';
import type Locale from '@/i18n/Locale';
import locales from '@/i18n/locales';
import type AppConfig from '@/server/config/AppConfig';

type Env = Record<string, string | undefined>;

function text(value: string | undefined): string | null {
    const trimmed = (value ?? '').trim();
    return trimmed === '' ? null : trimmed;
}

function bool(name: string, value: string | undefined, fallback: boolean): boolean {
    const normalized = text(value)?.toLowerCase();
    if (normalized === undefined || normalized === null) {
        return fallback;
    }
    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
        return true;
    }
    if (['0', 'false', 'no', 'off'].includes(normalized)) {
        return false;
    }
    throw new Error(`Invalid boolean value "${value}" for ${name}`);
}

function int(value: string | undefined, fallback: number, name: string): number {
    const normalized = text(value);
    if (normalized === null) {
        return fallback;
    }
    const parsed = Number(normalized);
    if (!Number.isInteger(parsed)) {
        throw new Error(`Invalid integer value for ${name}: "${value}"`);
    }
    return parsed;
}

function size(value: string | undefined, fallback: number): number {
    const normalized = text(value);
    if (normalized === null) {
        return fallback;
    }
    const match = /^(\d+)\s*(b|kb|mb|gb)?$/i.exec(normalized);
    if (match === null) {
        throw new Error(`Invalid size value "${value}"`);
    }
    const factors: Record<string, number> = {b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3};
    return Number(match[1]) * factors[(match[2] ?? 'b').toLowerCase()];
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T, name: string): T {
    const normalized = text(value);
    if (normalized === null) {
        return fallback;
    }
    if (!(allowed as readonly string[]).includes(normalized)) {
        throw new Error(`Invalid value for ${name}: "${value}". Allowed: ${allowed.join(', ')}`);
    }
    return normalized as T;
}

/**
 * Parses the instance configuration from environment variables. Every value has a sensible default,
 * so an empty environment starts a working single-tenant instance with SQLite in ./data.
 */
export default function parseConfig(env: Env): AppConfig {
    const dataDir = path.resolve(/*turbopackIgnore: true*/ text(env.DATA_DIR) ?? './data');
    const driver = oneOf(env.DB_DRIVER, ['sqlite', 'mysql', 'postgres'] as const, 'sqlite', 'DB_DRIVER');
    const smtpHost = text(env.SMTP_HOST);

    return {
        appMode:           oneOf(env.APP_MODE, ['single', 'multi'] as const, 'single', 'APP_MODE'),
        appName:           text(env.APP_NAME) ?? 'Annuva',
        appUrl:            text(env.APP_URL)?.replace(/\/+$/, '') ?? null,
        authSecret:        text(env.AUTH_SECRET),
        dataDir,
        database:          {
            database:   text(env.DB_NAME) ?? 'annuva',
            driver,
            host:       text(env.DB_HOST) ?? 'localhost',
            password:   env.DB_PASSWORD ?? '',
            port:       int(env.DB_PORT, driver === 'mysql' ? 3306 : 5432, 'DB_PORT'),
            sqliteFile: path.resolve(dataDir, text(env.DB_SQLITE_FILE) ?? 'annuva.sqlite'),
            url:        text(env.DATABASE_URL),
            user:       text(env.DB_USER) ?? 'annuva',
        },
        defaultLocale:     oneOf<Locale>(env.DEFAULT_LOCALE, locales, 'en', 'DEFAULT_LOCALE'),
        defaultTimezone:   text(env.DEFAULT_TIMEZONE) ?? 'Europe/Berlin',
        gravatarEnabled:   bool('GRAVATAR_ENABLED', env.GRAVATAR_ENABLED, true),
        logLevel:          oneOf(env.LOG_LEVEL, ['debug', 'info', 'warn', 'error'] as const, 'info', 'LOG_LEVEL'),
        mailFrom:          text(env.MAIL_FROM),
        sessionMaxAgeDays: int(env.SESSION_MAX_AGE_DAYS, 30, 'SESSION_MAX_AGE_DAYS'),
        setupToken:        text(env.SETUP_TOKEN),
        smtp:              smtpHost === null ? null : {
            host:     smtpHost,
            password: env.SMTP_PASSWORD ?? '',
            port:     int(env.SMTP_PORT, 587, 'SMTP_PORT'),
            secure:   bool('SMTP_SECURE', env.SMTP_SECURE, false),
            user:     env.SMTP_USER ?? '',
        },
        uploadMaxSize:     size(env.UPLOAD_MAX_SIZE, 20 * 1024 ** 2),
    };
}
