export default interface PublicToken {
    createdAt: string;
    expiresAt: string | null;
    id: string;
    lastUsedAt: string | null;
    name: string;
    prefix: string;
    scope: string;
}
