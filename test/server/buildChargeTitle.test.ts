import {describe, expect, it} from 'vitest';
import buildChargeTitle from '@/server/billing/buildChargeTitle';

describe('buildChargeTitle', () => {
    it('prefixes the description with the service label', () => {
        expect(buildChargeTitle('Hosting', 'example.com')).toBe('Hosting example.com');
    });

    it('uses the label alone without a description', () => {
        expect(buildChargeTitle('Domain', null)).toBe('Domain');
        expect(buildChargeTitle('Domain', undefined)).toBe('Domain');
        expect(buildChargeTitle('Domain', '   ')).toBe('Domain');
    });

    it('does not repeat a label the description already contains', () => {
        expect(buildChargeTitle('Hosting', 'Hosting Website & Portal')).toBe('Hosting Website & Portal');
        expect(buildChargeTitle('Wartung', 'wartung Buchungsanbindung')).toBe('wartung Buchungsanbindung');
        expect(buildChargeTitle('Hosting', 'Hostingpaket Premium')).toBe('Hostingpaket Premium');
        expect(buildChargeTitle('Hosting', 'Website-Hosting')).toBe('Website-Hosting');
        expect(buildChargeTitle('Paket', 'Managed-WordPress-Paket')).toBe('Managed-WordPress-Paket');
    });
});
