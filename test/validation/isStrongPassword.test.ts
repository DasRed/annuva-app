import {describe, expect, it} from 'vitest';
import isStrongPassword from '@/validation/isStrongPassword';
import passwordSchema from '@/server/security/passwordSchema';

describe('isStrongPassword', () => {
    it('accepts 9 characters with upper-case, lower-case and a digit', () => {
        expect(isStrongPassword('Abcdefgh1')).toBe(true);
        expect(isStrongPassword('Ärger2026x')).toBe(true);
        expect(isStrongPassword('Pass word 1!')).toBe(true);
    });

    it('rejects passwords that miss a rule', () => {
        expect(isStrongPassword('Abcdefg1')).toBe(false);
        expect(isStrongPassword('abcdefgh1')).toBe(false);
        expect(isStrongPassword('ABCDEFGH1')).toBe(false);
        expect(isStrongPassword('Abcdefghi')).toBe(false);
        expect(isStrongPassword(`Aa1${'x'.repeat(198)}`)).toBe(false);
    });

    it('is enforced by the server schema', () => {
        expect(passwordSchema.safeParse('Abcdefgh1').success).toBe(true);
        expect(passwordSchema.safeParse('very-secret-password').success).toBe(false);
    });
});
