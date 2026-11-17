import type {z} from 'zod';
import type EntityDefinition from '@/entity/EntityDefinition';
import type FieldDefinition from '@/entity/FieldDefinition';
import assertAdmin from '@/server/auth/assertAdmin';
import assertWrite from '@/server/auth/assertWrite';
import type AuthContext from '@/server/auth/AuthContext';
import EntityService from '@/server/entity/EntityService';
import resolveEntityName from '@/server/entity/resolveEntityName';
import ApiError from '@/server/error/ApiError';
import detectMimeType from '@/server/file/detectMimeType';
import type fileAttachSchema from '@/server/file/fileAttachSchema';
import fileUploadSchema from '@/server/file/fileUploadSchema';
import storeFile from '@/server/file/storeFile';
import toPublicFile from '@/server/file/toPublicFile';
import type UploadResult from '@/server/file/UploadResult';
import parseInput from '@/server/validation/parseInput';

type AttachTarget = z.infer<typeof fileAttachSchema>;

/**
 * Uploads for UI, REST API and MCP. A file can be attached to a record in the same call, e.g. a
 * receipt PDF to an expense; the record is then updated through the EntityService (validation,
 * permissions, audit log).
 */
export default class FileService {
    async upload(context: AuthContext, content: Buffer, fileName: string, declaredMimeType?: string | null, attachTo?: AttachTarget): Promise<UploadResult> {
        assertWrite(context);
        if (content.length === 0) {
            throw ApiError.badRequest('file_empty', 'The file is empty.');
        }
        const mimeType = detectMimeType(content, fileName, declaredMimeType);
        const target = attachTo === undefined ? null : await this.resolveTarget(context, attachTo, mimeType);
        const file = await storeFile(context, content, fileName, mimeType);
        if (target === null) {
            return toPublicFile(file);
        }
        const record = await target.service.update(context, target.id, {[target.field.name]: file.id});
        return {...toPublicFile(file), record};
    }

    /**
     * JSON variant with base64 content, used by the MCP server and API clients without multipart.
     */
    async uploadBase64(context: AuthContext, input: unknown): Promise<UploadResult> {
        assertWrite(context);
        const parsed = parseInput(fileUploadSchema, input);
        const {content, mimeType} = this.decode(parsed.content);
        return this.upload(context, content, parsed.fileName, parsed.mimeType ?? mimeType, parsed.attachTo);
    }

    private decode(value: string): { content: Buffer; mimeType: string | null } {
        const dataUrl = /^data:([^;,]*)(?:;[^,]*)?;base64,/i.exec(value);
        const base64 = (dataUrl === null ? value : value.slice(dataUrl[0].length)).replace(/\s+/g, '');
        if (base64 === '' || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(base64)) {
            throw ApiError.badRequest('invalid_content', 'The content must be base64 encoded.', [{field: 'content', message: 'invalid'}]);
        }
        return {content: Buffer.from(base64, 'base64'), mimeType: dataUrl?.[1] || null};
    }

    private matchesAccept(accept: string | undefined, mimeType: string): boolean {
        if (accept === undefined || accept.trim() === '') {
            return true;
        }
        return accept.split(',').map((entry) => entry.trim().toLowerCase()).some((entry) => entry === mimeType || (entry.endsWith('/*') && mimeType.startsWith(entry.slice(0, -1))));
    }

    /**
     * Checks the target before the file is stored, so a wrong target leaves no orphaned file.
     */
    private async resolveTarget(context: AuthContext, attachTo: AttachTarget, mimeType: string): Promise<{ field: FieldDefinition; id: string; service: EntityService }> {
        const service = new EntityService(resolveEntityName(attachTo.entity));
        const definition: EntityDefinition = service.definition;
        if (definition.adminOnly === true) {
            assertAdmin(context);
        }
        const fileFields = definition.fields.filter((field) => field.type === 'file' && field.readOnly !== true);
        const field = attachTo.field === undefined && fileFields.length === 1 ? fileFields[0] : fileFields.find((candidate) => candidate.name === attachTo.field);
        if (field === undefined) {
            const names = fileFields.map((candidate) => candidate.name).join(', ');
            throw ApiError.badRequest('invalid_field', `Choose the file field of ${attachTo.entity}: ${names}.`, [{field: 'attachTo.field', message: 'invalid'}]);
        }
        if (!this.matchesAccept(field.accept, mimeType)) {
            throw ApiError.badRequest('invalid_file_type', `${field.name} only accepts ${field.accept}, not ${mimeType}.`, [{field: 'content', message: 'invalid'}]);
        }
        await service.get(context, attachTo.id);
        return {field, id: attachTo.id, service};
    }
}
