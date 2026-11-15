export default interface ListQuery {
    customerId?: string;
    filters?: Record<string, string>;
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
    order?: 'asc' | 'desc';
    q?: string;
    sort?: string;
}
