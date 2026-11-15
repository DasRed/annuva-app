export default interface ApiTokenTable {
    createdAt: string;
    expiresAt: string | null;
    id: string;
    lastUsedAt: string | null;
    name: string;
    prefix: string;
    scope: string;
    tenantId: string | null;
    tokenHash: string;
    userId: string;
}
