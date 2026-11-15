import type Locale from '@/i18n/Locale';
import type AuthContext from '@/server/auth/AuthContext';
import type Role from '@/server/auth/Role';
import type UserTable from '@/server/db/table/UserTable';

export default function contextFromUser(user: UserTable, scope: AuthContext['scope'], via: AuthContext['via']): AuthContext {
    return {
        locale:   user.locale as Locale,
        role:     user.role as Role,
        scope,
        tenantId: user.tenantId,
        userId:   user.id,
        via,
    };
}
