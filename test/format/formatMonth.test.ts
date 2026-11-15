import {describe, expect, it} from 'vitest';
import formatMonth from '@/format/formatMonth';

describe('formatMonth', () => {
    it('names the month in the given language', () => {
        expect(formatMonth(1, 'de')).toBe('Januar');
        expect(formatMonth(3, 'de')).toBe('März');
        expect(formatMonth(12, 'en')).toBe('December');
    });
});
