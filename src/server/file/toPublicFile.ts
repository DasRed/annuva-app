import type FileTable from '@/server/db/table/FileTable';
import type PublicFile from '@/server/file/PublicFile';

export default function toPublicFile(file: FileTable): PublicFile {
    return {
        createdAt:    file.createdAt,
        id:           file.id,
        mimeType:     file.mimeType,
        originalName: file.originalName,
        size:         file.size,
        url:          `/api/v1/files/${file.id}`,
    };
}
