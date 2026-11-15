import getDb from '@/server/db/getDb';
import type UserTable from '@/server/db/table/UserTable';
import hashToken from '@/server/security/hashToken';
import nowIso from '@/server/util/nowIso';

export default async function findSessionUser(token: string | undefined): Promise<UserTable | null> {
    if (token === undefined || token === '') {
        return null;
    }
    const db = await getDb();
    const user = await db.selectFrom('sessions')
                         .innerJoin('users', 'users.id', 'sessions.userId')
                         .selectAll('users')
                         .where('sessions.id', '=', hashToken(token))
                         .where('sessions.expiresAt', '>', nowIso())
                         .where('users.active', '=', 1)
                         .executeTakeFirst();
    return user ?? null;
}
