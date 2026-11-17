import {describe, expect, it} from 'vitest';
import detectMimeType from '@/server/file/detectMimeType';

describe('detectMimeType', () => {
    it('prefers the content signature over declared type and extension', () => {
        expect(detectMimeType(Buffer.from('%PDF-1.4'), 'receipt.txt', 'text/plain')).toBe('application/pdf');
        expect(detectMimeType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]), 'logo')).toBe('image/png');
        expect(detectMimeType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'photo')).toBe('image/jpeg');
        expect(detectMimeType(Buffer.from('RIFF\0\0\0\0WEBPVP8 '), 'image')).toBe('image/webp');
    });

    it('falls back to the declared type, then to the extension', () => {
        expect(detectMimeType(Buffer.from('a,b'), 'data.bin', 'Text/CSV')).toBe('text/csv');
        expect(detectMimeType(Buffer.from('a,b'), 'data.CSV', 'application/octet-stream')).toBe('text/csv');
        expect(detectMimeType(Buffer.from('?'), 'unknown')).toBe('application/octet-stream');
    });
});
