import type EntityName from '@/entity/EntityName';
import type FieldDefinition from '@/entity/FieldDefinition';

/**
 * Client-safe description of an entity. Server-side behaviour (hooks) is registered separately.
 */
export default interface EntityDefinition {
    /** Only tenant admins may write. */
    adminOnly?: boolean;
    /** Field that links a record to a customer (used for customer filters). */
    customerField?: string;
    /** Generic create/update/delete is disabled; a dedicated service handles writes. */
    customWrite?: boolean;
    defaultSort: {
        direction: 'asc' | 'desc';
        field: string;
    };
    fields: readonly FieldDefinition[];
    name: EntityName;
    /** Singular name used for MCP tool names, e.g. "customer". */
    singular: string;
    table: string;
    titleField: string;
}
