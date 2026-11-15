import type AuthContext from '@/server/auth/AuthContext';

type Row = Record<string, unknown>;

/**
 * Server-side behaviour of an entity on top of the generic CRUD. Rows are in storage format.
 */
export default interface EntityHooks {
    afterWrite?(context: AuthContext, row: Row): Promise<void>;
    beforeCreate?(context: AuthContext, data: Row): Promise<void>;
    beforeDelete?(context: AuthContext, existing: Row): Promise<void>;
    beforeUpdate?(context: AuthContext, existing: Row, data: Row): Promise<void>;
}
