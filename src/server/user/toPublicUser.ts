import type Locale from '@/i18n/Locale';
import type Role from '@/server/auth/Role';
import getConfig from '@/server/config/getConfig';
import type UserTable from '@/server/db/table/UserTable';
import type PublicUser from '@/server/user/PublicUser';
import sha256 from '@/server/util/sha256';

export default function toPublicUser(user: UserTable): PublicUser {
    let avatarUrl: string | null = null;
    if (user.avatarFileId !== null) {
        avatarUrl = `/api/v1/files/${user.avatarFileId}`;
    }
    else if (getConfig().gravatarEnabled) {
        avatarUrl = `https://www.gravatar.com/avatar/${sha256(user.email.trim().toLowerCase())}?s=128&d=404`;
    }
    return {
        active:           user.active === 1,
        avatarFileId:     user.avatarFileId,
        avatarUrl,
        createdAt:        user.createdAt,
        email:            user.email,
        id:               user.id,
        lastLoginAt:      user.lastLoginAt,
        locale:           user.locale as Locale,
        name:             user.name,
        role:             user.role as Role,
        tenantId:         user.tenantId,
        theme:            user.theme as PublicUser['theme'],
        timezone:         user.timezone,
        twoFactorEnabled: user.totpEnabledAt !== null,
    };
}
