import {describe, expect, it} from 'vitest';
import missingAddressParts from '@/address/missingAddressParts';
import type PostalAddress from '@/address/PostalAddress';

const empty: PostalAddress = {addition: null, city: null, country: 'DE', houseNumber: null, postalCode: null, street: null};

describe('missingAddressParts', () => {
    it('accepts an empty address with a country only', () => {
        expect(missingAddressParts(empty)).toEqual([]);
    });

    it('requires street, postal code and city once the address is started', () => {
        expect(missingAddressParts({...empty, houseNumber: '4'})).toEqual(['street', 'postalCode', 'city']);
        expect(missingAddressParts({...empty, city: 'Dachau', street: 'Am Markt'})).toEqual(['postalCode']);
        expect(missingAddressParts({...empty, city: 'Dachau', postalCode: '85221', street: 'Am Markt'})).toEqual([]);
    });
});
