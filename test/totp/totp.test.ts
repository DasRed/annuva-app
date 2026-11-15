import {describe, expect, it} from 'vitest';
import base32Decode from '@/server/totp/base32Decode';
import base32Encode from '@/server/totp/base32Encode';
import totpCode from '@/server/totp/totpCode';
import totpStep from '@/server/totp/totpStep';
import verifyTotp from '@/server/totp/verifyTotp';

const secret = Buffer.from('12345678901234567890');

describe('TOTP', () => {
    it('encodes and decodes base32', () => {
        expect(base32Encode(secret)).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
        expect(base32Decode('gezd gnbv-gy3t qojq gezd gnbv gy3t qojq')).toEqual(secret);
    });

    it('matches the RFC 6238 test vectors (SHA-1, 8 digits)', () => {
        expect(totpCode(secret, totpStep(59_000), 8)).toBe('94287082');
        expect(totpCode(secret, totpStep(1_111_111_109_000), 8)).toBe('07081804');
        expect(totpCode(secret, totpStep(1_234_567_890_000), 8)).toBe('89005924');
        expect(totpCode(secret, totpStep(2_000_000_000_000), 8)).toBe('69279037');
    });

    it('accepts the neighbouring steps but never a step twice', () => {
        const now = 1_700_000_000_000;
        const step = totpStep(now);
        expect(verifyTotp(secret, totpCode(secret, step), null, now)).toBe(step);
        expect(verifyTotp(secret, totpCode(secret, step - 1), null, now)).toBe(step - 1);
        expect(verifyTotp(secret, totpCode(secret, step + 2), null, now)).toBeNull();
        expect(verifyTotp(secret, totpCode(secret, step), step, now)).toBeNull();
        expect(verifyTotp(secret, 'abcdef', null, now)).toBeNull();
    });
});
