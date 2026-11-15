import type Locale from '@/i18n/Locale';
import type Role from '@/server/auth/Role';

export default interface PublicUser {
    active: boolean;
    avatarFileId: string | null;
    avatarUrl: string | null;
    createdAt: string;
    email: string;
    id: string;
    lastLoginAt: string | null;
    locale: Locale;
    name: string;
    role: Role;
    tenantId: string | null;
    theme: 'dark' | 'light' | 'system';
    timezone: string;
    twoFactorEnabled: boolean;
}
