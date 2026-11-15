import apiRoute from '@/server/api/apiRoute';
import assertWrite from '@/server/auth/assertWrite';
import getRequestContext from '@/server/auth/getRequestContext';
import ApiError from '@/server/error/ApiError';
import storeFile from '@/server/file/storeFile';

/**
 * Multipart upload with a field "file". Returns the file record; link it to a record via its id.
 */
export const POST = apiRoute(async (request) => {
    const context = await getRequestContext(request);
    assertWrite(context);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
        throw ApiError.badRequest('file_missing', 'Send the file in the form field "file".');
    }
    const stored = await storeFile(context, Buffer.from(await file.arrayBuffer()), file.name, file.type);
    return Response.json({createdAt: stored.createdAt, id: stored.id, mimeType: stored.mimeType, originalName: stored.originalName, size: stored.size}, {status: 201});
});
