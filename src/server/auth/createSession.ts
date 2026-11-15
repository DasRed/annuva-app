import getConfig from '@/server/config/getConfig';
import getDb from '@/server/db/getDb';
import hashToken from '@/server/security/hashToken';
import nowIso from '@/server/util/nowIso';
import randomToken from '@/server/util/randomToken';

/**
 * Creates a session and returns the raw token for the cookie. Only its hash is stored.
 */
export default async function createSession(userId: string, userAgent: string | null, ip: string | null): Promise<{ expiresAt: Date; token: string }> {
    const token = randomToken();
    const expiresAt = new Date(Date.now() + getConfig().sessionMaxAgeDays * 24 * 60 * 60 * 1000);
    const db = await getDb();
    await db.insertInto('sessions').values({
        createdAt: nowIso(),
        expiresAt: expiresAt.toISOString(),
        id:        hashToken(token),
        ip:        ip?.slice(0, 255) ?? null,
        userAgent: userAgent?.slice(0, 255) ?? null,
        userId,
    }).execute();
    await db.updateTable('users').set({lastLoginAt: nowIso()}).where('id', '=', userId).execute();
    return {expiresAt, token};
}
