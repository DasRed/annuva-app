import type Locale from '@/i18n/Locale';
import type Role from '@/server/auth/Role';

/**
 * Who performs an action and through which channel. Every service call receives one.
 */
export default interface AuthContext {
    locale: Locale;
    role: Role;
    scope: 'read' | 'read_write';
    tenantId: string | null;
    userId: string;
    via: 'api' | 'mcp' | 'system' | 'ui';
}
