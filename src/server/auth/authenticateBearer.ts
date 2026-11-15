import getDb from '@/server/db/getDb';
import type UserTable from '@/server/db/table/UserTable';
import hashToken from '@/server/security/hashToken';
import nowIso from '@/server/util/nowIso';

/**
 * Resolves an API token (`hf_…`) to its user. Expired tokens and inactive users are rejected.
 */
export default async function authenticateBearer(token: string): Promise<{ scope: 'read' | 'read_write'; user: UserTable } | null> {
    const db = await getDb();
    const now = nowIso();
    const row = await db.selectFrom('apiTokens')
                        .innerJoin('users', 'users.id', 'apiTokens.userId')
                        .selectAll('users')
                        .select(['apiTokens.id as tokenId', 'apiTokens.scope as tokenScope', 'apiTokens.expiresAt as tokenExpiresAt'])
                        .where('apiTokens.tokenHash', '=', hashToken(token))
                        .where('users.active', '=', 1)
                        .executeTakeFirst();
    if (row === undefined || (row.tokenExpiresAt !== null && row.tokenExpiresAt <= now)) {
        return null;
    }
    await db.updateTable('apiTokens').set({lastUsedAt: now}).where('id', '=', row.tokenId).execute();
    const {tokenId: _tokenId, tokenScope, tokenExpiresAt: _tokenExpiresAt, ...user} = row;
    return {scope: tokenScope === 'read' ? 'read' : 'read_write', user};
}
