import path from 'node:path';

const signatures: readonly { bytes: readonly number[]; mimeType: string; offset?: number }[] = [
    {bytes: [0x25, 0x50, 0x44, 0x46, 0x2d], mimeType: 'application/pdf'},
    {bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], mimeType: 'image/png'},
    {bytes: [0xff, 0xd8, 0xff], mimeType: 'image/jpeg'},
    {bytes: [0x47, 0x49, 0x46, 0x38], mimeType: 'image/gif'},
    {bytes: [0x57, 0x45, 0x42, 0x50], mimeType: 'image/webp', offset: 8},
];

const extensions: Readonly<Record<string, string>> = {
    '.csv':  'text/csv',
    '.gif':  'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg':  'image/jpeg',
    '.pdf':  'application/pdf',
    '.png':  'image/png',
    '.txt':  'text/plain',
    '.webp': 'image/webp',
    '.xml':  'application/xml',
    '.zip':  'application/zip',
};

/**
 * Determines the MIME type of an upload: the content signature (PDF and common images) wins, then
 * the type the client declared, then the file extension.
 */
export default function detectMimeType(content: Buffer, fileName: string, declared?: string | null): string {
    const signature = signatures.find(({bytes, offset = 0}) => content.length >= offset + bytes.length && bytes.every((byte, index) => content[offset + index] === byte));
    if (signature !== undefined) {
        return signature.mimeType;
    }
    const type = declared?.trim().toLowerCase() ?? '';
    if (type !== '' && type !== 'application/octet-stream') {
        return type;
    }
    return extensions[path.extname(fileName).toLowerCase()] ?? 'application/octet-stream';
}
