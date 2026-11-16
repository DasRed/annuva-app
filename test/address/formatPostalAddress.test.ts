import {describe, expect, it} from 'vitest';
import formatPostalAddress from '@/address/formatPostalAddress';
import type PostalAddress from '@/address/PostalAddress';

const address = (parts: Partial<PostalAddress>): PostalAddress => ({addition: null, city: null, country: null, houseNumber: null, postalCode: null, street: null, ...parts});

describe('formatPostalAddress', () => {
    it('formats a German address without the home country', () => {
        const lines = formatPostalAddress(address({city: 'Vierkirchen', country: 'DE', houseNumber: '10', postalCode: '85256', street: 'Carl-Thiemann-Straße'}), {homeCountry: 'DE', language: 'de'});
        expect(lines).toEqual(['Carl-Thiemann-Straße 10', '85256 Vierkirchen']);
    });

    it('adds the country in capitals when it differs from the home country', () => {
        const lines = formatPostalAddress(address({addition: 'c/o Muster', city: 'Wien', country: 'AT', houseNumber: '1', postalCode: '1010', street: 'Graben'}), {homeCountry: 'DE', language: 'de'});
        expect(lines).toEqual(['c/o Muster', 'Graben 1', '1010 Wien', 'ÖSTERREICH']);
    });

    it('follows the conventions of the address country', () => {
        const lines = formatPostalAddress(address({city: 'London', country: 'GB', houseNumber: '1', postalCode: 'EC1A 1AA', street: 'Example Street'}), {homeCountry: 'DE', language: 'en'});
        expect(lines).toEqual(['1 Example Street', 'London EC1A 1AA', 'UNITED KINGDOM']);
    });

    it('prints nothing for an empty address, not even the country', () => {
        expect(formatPostalAddress(address({country: 'AT'}), {homeCountry: 'DE', language: 'de'})).toEqual([]);
    });
});
