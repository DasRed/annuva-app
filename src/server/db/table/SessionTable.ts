export default interface SessionTable {
    createdAt: string;
    expiresAt: string;
    id: string;
    ip: string | null;
    userAgent: string | null;
    userId: string;
}
