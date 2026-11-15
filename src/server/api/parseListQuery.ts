import type ListQuery from '@/entity/ListQuery';

/**
 * Query parameters of list endpoints: limit, offset, sort, order, q, customerId, includeArchived and
 * equality filters as `filter[field]=value`.
 */
export default function parseListQuery(url: URL): ListQuery {
    const params = url.searchParams;
    const filters: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
        const match = /^filter\[(\w+)\]$/.exec(key);
        if (match !== null) {
            filters[match[1]] = value;
        }
    }
    const number = (name: string) => (params.has(name) ? Number(params.get(name)) : undefined);
    const order = params.get('order');
    return {
        customerId:      params.get('customerId') ?? undefined,
        filters,
        includeArchived: params.get('includeArchived') === 'true',
        limit:           number('limit'),
        offset:          number('offset'),
        order:           order === 'asc' || order === 'desc' ? order : undefined,
        q:               params.get('q') ?? undefined,
        sort:            params.get('sort') ?? undefined,
    };
}
