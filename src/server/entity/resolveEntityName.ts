import entities from '@/entity/entities';
import type EntityName from '@/entity/EntityName';
import ApiError from '@/server/error/ApiError';

/**
 * Maps a URL segment (kebab-case, e.g. "recurring-charges") to an entity name.
 */
export default function resolveEntityName(segment: string): EntityName {
    const name = segment.replace(/-([a-z])/g, (match, letter: string) => letter.toUpperCase());
    if (!(name in entities) || name === 'invoices') {
        throw ApiError.notFound(`Unknown resource "${segment}".`);
    }
    return name as EntityName;
}
