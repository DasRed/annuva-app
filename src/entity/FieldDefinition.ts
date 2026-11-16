import type EntityName from '@/entity/EntityName';
import type FieldType from '@/entity/FieldType';

/**
 * Describes one field of an entity. The same definition drives database access, validation,
 * the REST API, the OpenAPI document, the MCP tools and the generic UI (tables and forms).
 */
export default interface FieldDefinition {
    /** Accepted file types of a file field, e.g. "image/*". */
    accept?: string;
    /** Default value for new records. */
    default?: boolean | number | string | null;
    /** Visual group in forms: the first field of a group gets a heading ("group.<entity>.<group>"). */
    group?: string;
    /** Show the field in list tables. */
    list?: boolean;
    /** Maximum length for string fields, maximum value for integer fields. */
    max?: number;
    /** Minimum value for integer fields. */
    min?: number;
    name: string;
    /** Allowed values of an enum field. */
    options?: readonly string[];
    /** System-managed field: returned by the API, never written by clients. */
    readOnly?: boolean;
    /** Target entity of a relation field. */
    relation?: EntityName;
    required?: boolean;
    type: FieldType;
    /** Only show (and send) the field in forms when another field has one of the given values. */
    visibleWhen?: {
        field: string;
        values: readonly string[];
    };
}
