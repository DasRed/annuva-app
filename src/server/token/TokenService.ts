import {z} from 'zod';
import writeAudit from '@/server/audit/writeAudit';
import assertWrite from '@/server/auth/assertWrite';
import type AuthContext from '@/server/auth/AuthContext';
import getDb from '@/server/db/getDb';
import ApiError from '@/server/error/ApiError';
import type PublicToken from '@/server/token/PublicToken';
import hashToken from '@/server/security/hashToken';
import newId from '@/server/util/newId';
import nowIso from '@/server/util/nowIso';
import randomToken from '@/server/util/randomToken';

const createSchema = z.object({
    expiresAt: z.iso.date().refine((value) => value >= new Date().toISOString().slice(0, 10), {message: 'The expiry date must not be in the past'}).nullable().optional(),
    name:      z.string().trim().min(1).max(255),
    scope:     z.enum(['read', 'read_write']).default('read'),
}).strict();


/**
 * Personal API tokens. A token acts as its user; with scope "read" it can only read.
 */
export default class TokenService {
    async create(context: AuthContext, input: unknown): Promise<PublicToken & { token: string }> {
        assertWrite(context);
        const result = createSchema.safeParse(input ?? {});
        if (!result.success) {
            throw ApiError.badRequest('validation_failed', 'The data is invalid.', result.error.issues.map((issue) => ({
                field:   issue.path.join('.'),
                message: issue.message,
            })));
        }
        const token = `an_${randomToken(32)}`;
        const row = {
            createdAt:  nowIso(),
            expiresAt:  result.data.expiresAt === null || result.data.expiresAt === undefined ? null : `${result.data.expiresAt}T23:59:59.999Z`,
            id:         newId(),
            lastUsedAt: null,
            name:       result.data.name,
            prefix:     token.slice(0, 10),
            scope:      result.data.scope,
            tenantId:   context.tenantId,
            tokenHash:  hashToken(token),
            userId:     context.userId,
        };
        const db = await getDb();
        await db.insertInto('apiTokens').values(row).execute();
        await writeAudit(context, 'create', 'apiTokens', row.id, {name: row.name, scope: row.scope});
        const {tokenHash: _tokenHash, tenantId: _tenantId, userId: _userId, ...publicToken} = row;
        return {...publicToken, token};
    }

    async list(context: AuthContext): Promise<PublicToken[]> {
        const db = await getDb();
        return db.selectFrom('apiTokens')
                 .select(['id', 'name', 'prefix', 'scope', 'expiresAt', 'lastUsedAt', 'createdAt'])
                 .where('userId', '=', context.userId)
                 .orderBy('createdAt', 'desc')
                 .execute();
    }

    async revoke(context: AuthContext, id: string): Promise<void> {
        assertWrite(context);
        const db = await getDb();
        const result = await db.deleteFrom('apiTokens').where('id', '=', id).where('userId', '=', context.userId).executeTakeFirst();
        if (Number(result.numDeletedRows) === 0) {
            throw ApiError.notFound('Token not found.');
        }
        await writeAudit(context, 'delete', 'apiTokens', id);
    }
}
