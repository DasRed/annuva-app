export default interface UserTable {
    active: number;
    avatarFileId: string | null;
    createdAt: string;
    email: string;
    id: string;
    lastLoginAt: string | null;
    locale: string;
    name: string;
    passwordHash: string;
    role: string;
    tenantId: string | null;
    theme: string;
    timezone: string;
    updatedAt: string;
}
