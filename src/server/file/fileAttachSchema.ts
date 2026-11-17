import {z} from 'zod';
import attachableEntities from '@/server/file/attachableEntities';

/**
 * Record an uploaded file is attached to. `field` may be omitted when the entity has only one file field.
 */
const fileAttachSchema = z.object({
    entity: z.enum(attachableEntities).describe('Entity as in the REST path, e.g. "expenses" (receiptFileId) or "offers" (fileId)'),
    field:  z.string().optional().describe('File field of the record; only needed for entities with several file fields (invoice-templates: logoFileId, signatureFileId)'),
    id:     z.uuid().describe('Id of the record'),
}).strict();

export default fileAttachSchema;
