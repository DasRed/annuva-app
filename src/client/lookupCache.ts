import type EntityName from '@/entity/EntityName';

/**
 * Cache of id → title lookups for relation fields, shared by all components of a page.
 */
const lookupCache = new Map<EntityName, Promise<{ archived?: boolean; id: string; title: string }[]>>();

export default lookupCache;
