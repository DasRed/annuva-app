import apiFetch from '@/client/apiFetch';
import lookupCache from '@/client/lookupCache';
import entities from '@/entity/entities';
import entityPath from '@/entity/entityPath';
import type EntityName from '@/entity/EntityName';
import type ListResult from '@/entity/ListResult';

export default function loadLookup(name: EntityName, refresh = false): Promise<{ archived?: boolean; id: string; title: string }[]> {
    if (refresh || !lookupCache.has(name)) {
        const definition = entities[name];
        const archived = name === 'customers' ? '&includeArchived=true' : '';
        lookupCache.set(name, apiFetch<ListResult>(`/api/v1/${entityPath(name)}?limit=1000&sort=${definition.titleField}&order=asc${archived}`).then((result) => result.items.map((item) => ({
            archived: name === 'customers' && item.archivedAt !== null,
            id:       item.id,
            title:    String(item[definition.titleField] ?? item.id),
        }))).catch((error: unknown) => {
            lookupCache.delete(name);
            throw error;
        }));
    }
    return lookupCache.get(name)!;
}
