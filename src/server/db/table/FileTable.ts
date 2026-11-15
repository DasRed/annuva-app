export default interface FileTable {
    createdAt: string;
    createdBy: string | null;
    id: string;
    mimeType: string;
    originalName: string;
    sha256: string;
    size: number;
    tenantId: string | null;
}
