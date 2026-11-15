export default interface AuditLogTable {
    action: string;
    createdAt: string;
    data: string | null;
    entity: string;
    entityId: string | null;
    id: string;
    tenantId: string | null;
    userId: string | null;
    via: string;
}
