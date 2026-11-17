import apiRoute from '@/server/api/apiRoute';
import readJson from '@/server/api/readJson';
import getRequestContext from '@/server/auth/getRequestContext';
import ApiError from '@/server/error/ApiError';
import fileAttachSchema from '@/server/file/fileAttachSchema';
import FileService from '@/server/file/FileService';
import parseInput from '@/server/validation/parseInput';

/**
 * Upload a file, either as multipart (field "file", optional fields "entity", "id", "field") or as
 * JSON with base64 content (see fileUploadSchema). With a target the file is attached to that
 * record right away; otherwise link it later via its id.
 */
export const POST = apiRoute(async (request) => {
    const context = await getRequestContext(request);
    const files = new FileService();
    if ((request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
        return Response.json(await files.uploadBase64(context, await readJson(request)), {status: 201});
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
        throw ApiError.badRequest('file_missing', 'Send the file in the form field "file".');
    }
    const value = (name: string) => {
        const entry = form.get(name);
        return typeof entry === 'string' && entry.trim() !== '' ? entry.trim() : undefined;
    };
    const attachTo = value('entity') === undefined && value('id') === undefined
                     ? undefined
                     : parseInput(fileAttachSchema, {entity: value('entity'), field: value('field'), id: value('id')});
    const stored = await files.upload(context, Buffer.from(await file.arrayBuffer()), file.name, file.type, attachTo);
    return Response.json(stored, {status: 201});
});
