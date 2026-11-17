import type EntityRecord from '@/entity/EntityRecord';
import type PublicFile from '@/server/file/PublicFile';

/**
 * Result of an upload: the stored file and, if it was attached right away, the updated record.
 */
export default interface UploadResult extends PublicFile {
    record?: EntityRecord;
}
