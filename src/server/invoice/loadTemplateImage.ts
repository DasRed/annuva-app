import type AuthContext from '@/server/auth/AuthContext';
import readStoredFile from '@/server/file/readStoredFile';

/**
 * Image of an invoice template (logo, signature) as data URL for the PDF; null when missing or
 * unreadable.
 */
export default async function loadTemplateImage(context: AuthContext, fileId: string | null | undefined): Promise<string | null> {
    if (fileId === null || fileId === undefined || fileId === '') {
        return null;
    }
    try {
        const {content, file} = await readStoredFile(context, fileId);
        return `data:${file.mimeType};base64,${content.toString('base64')}`;
    }
    catch {
        return null;
    }
}
