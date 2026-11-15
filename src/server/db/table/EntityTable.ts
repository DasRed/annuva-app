/**
 * Row type of the generic entity tables. Columns are described by the entity definitions.
 */
export default interface EntityTable {
    [column: string]: unknown;
    createdAt: string;
    id: string;
    tenantId: string;
    updatedAt: string;
}
