import fs from 'node:fs/promises';
import type AuthContext from '@/server/auth/AuthContext';
import getDb from '@/server/db/getDb';
import type FileTable from '@/server/db/table/FileTable';
import ApiError from '@/server/error/ApiError';
import filePath from '@/server/file/filePath';

/**
 * Loads a file of the caller's tenant. Avatars of users without tenant (instance admins) are only
 * readable by their owner.
 */
export default async function readStoredFile(context: AuthContext, id: string): Promise<{ content: Buffer; file: FileTable }> {
    const db = await getDb();
    const file = await db.selectFrom('files').selectAll().where('id', '=', id).executeTakeFirst();
    const allowed = file !== undefined && (file.tenantId === null ? file.createdBy === context.userId : file.tenantId === context.tenantId);
    if (!allowed) {
        throw ApiError.notFound('File not found.');
    }
    return {content: await fs.readFile(filePath(file.sha256)), file};
}
