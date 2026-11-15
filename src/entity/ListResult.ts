import type EntityRecord from '@/entity/EntityRecord';

export default interface ListResult {
    items: EntityRecord[];
    limit: number;
    offset: number;
    total: number;
}
