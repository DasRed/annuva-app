import type AuthContext from '@/server/auth/AuthContext';
import getDb from '@/server/db/getDb';
import logger from '@/server/log/logger';
import newId from '@/server/util/newId';
import nowIso from '@/server/util/nowIso';

/**
 * Records a write action. Failures are logged but never break the action itself.
 */
export default async function writeAudit(context: AuthContext, action: string, entity: string, entityId: string | null, data?: unknown): Promise<void> {
    try {
        const db = await getDb();
        await db.insertInto('auditLog').values({
            action,
            createdAt: nowIso(),
            data:      data === undefined ? null : JSON.stringify(data),
            entity,
            entityId,
            id:        newId(),
            tenantId:  context.tenantId,
            userId:    context.userId,
            via:       context.via,
        }).execute();
    }
    catch (error) {
        logger.warn('Could not write audit log entry', error);
    }
}
