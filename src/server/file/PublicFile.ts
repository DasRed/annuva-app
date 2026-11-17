/**
 * API representation of a stored file. `url` downloads the content (same authentication as the API).
 */
export default interface PublicFile {
    createdAt: string;
    id: string;
    mimeType: string;
    originalName: string;
    size: number;
    url: string;
}
