import fs from 'node:fs/promises';
import path from 'node:path';
import type AuthContext from '@/server/auth/AuthContext';
import getConfig from '@/server/config/getConfig';
import getDb from '@/server/db/getDb';
import type FileTable from '@/server/db/table/FileTable';
import ApiError from '@/server/error/ApiError';
import filePath from '@/server/file/filePath';
import newId from '@/server/util/newId';
import nowIso from '@/server/util/nowIso';
import sha256 from '@/server/util/sha256';

export default async function storeFile(context: AuthContext, content: Buffer, originalName: string, mimeType: string): Promise<FileTable> {
    if (content.length > getConfig().uploadMaxSize) {
        throw ApiError.badRequest('file_too_large', 'The file is too large.');
    }
    const hash = sha256(content);
    const target = filePath(hash);
    try {
        await fs.access(target);
    }
    catch {
        await fs.mkdir(path.dirname(target), {recursive: true});
        await fs.writeFile(`${target}.tmp`, content);
        await fs.rename(`${target}.tmp`, target);
    }

    const file: FileTable = {
        createdAt:    nowIso(),
        createdBy:    context.userId,
        id:           newId(),
        mimeType:     mimeType || 'application/octet-stream',
        originalName: path.basename(originalName).slice(0, 255) || 'file',
        sha256:       hash,
        size:         content.length,
        tenantId:     context.tenantId,
    };
    const db = await getDb();
    await db.insertInto('files').values(file).execute();
    return file;
}
