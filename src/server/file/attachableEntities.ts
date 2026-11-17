import entities from '@/entity/entities';
import entityPath from '@/entity/entityPath';
import type EntityName from '@/entity/EntityName';

/**
 * URL segments of the entities an uploaded file can be attached to: generic writes and at least one
 * writable file field (e.g. expenses → receiptFileId, offers → fileId).
 */
const attachableEntities = (Object.keys(entities) as EntityName[])
    .filter((name) => entities[name].customWrite !== true && entities[name].fields.some((field) => field.type === 'file' && field.readOnly !== true))
    .map(entityPath) as [string, ...string[]];

export default attachableEntities;
