import {z} from 'zod';
import fileAttachSchema from '@/server/file/fileAttachSchema';

/**
 * JSON upload (REST and MCP): the content as base64 or as data URL ("data:application/pdf;base64,…").
 */
const fileUploadSchema = z.object({
    attachTo: fileAttachSchema.optional().describe('Attach the file to this record right away'),
    content:  z.string().min(1).describe('File content, base64 encoded (a data URL works as well)'),
    fileName: z.string().trim().min(1).max(255).describe('Original file name incl. extension, e.g. "Rechnung_2026-11-16.pdf"'),
    mimeType: z.string().max(255).optional().describe('MIME type; detected from the content if omitted (PDF, PNG, JPEG, GIF, WebP)'),
}).strict();

export default fileUploadSchema;
