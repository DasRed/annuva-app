import {describe, expect, it} from 'vitest';
import legacyBillingFields from '@/address/legacyBillingFields';
import legacyTenantAddress from '@/address/legacyTenantAddress';
import parseLegacyAddress from '@/address/parseLegacyAddress';

describe('parseLegacyAddress', () => {
    it('splits street, house number, postal code and city', () => {
        expect(parseLegacyAddress('Ganghofer Str. 46\n85256 Vierkirchen').address).toMatchObject({city: 'Vierkirchen', houseNumber: '46', postalCode: '85256', street: 'Ganghofer Str.'});
        expect(parseLegacyAddress('Meisenstraße 1B\n85368 Moosburg an der Isar').address).toMatchObject({city: 'Moosburg an der Isar', houseNumber: '1B', street: 'Meisenstraße'});
        expect(parseLegacyAddress('Hauptstraße 12-14 a\n80331 München').address).toMatchObject({houseNumber: '12-14 a', street: 'Hauptstraße'});
    });

    it('recognizes countries and postal code prefixes', () => {
        expect(parseLegacyAddress('Graben 1\n1010 Wien\nÖsterreich').address).toMatchObject({city: 'Wien', country: 'AT', postalCode: '1010'});
        expect(parseLegacyAddress('Bahnhofstrasse 5\nCH-8001 Zürich').address).toMatchObject({city: 'Zürich', country: 'CH', postalCode: '8001'});
    });

    it('accepts a single line separated by commas', () => {
        expect(parseLegacyAddress('Am Markt 3, 85221 Dachau').address).toMatchObject({city: 'Dachau', houseNumber: '3', postalCode: '85221', street: 'Am Markt'});
    });

    it('keeps unrecognized text', () => {
        expect(parseLegacyAddress('Somewhere\nnear the station')).toMatchObject({leading: ['Somewhere', 'near the station'], recognized: false});
    });
});

describe('legacyBillingFields', () => {
    it('drops lines repeating the name and the contact person', () => {
        expect(legacyBillingFields('Michaela Hanisch\nGanghofer Str. 46\n85256 Vierkirchen', {contactName: 'Michaela Hanisch', name: 'Michaela Hanisch'})).toEqual({
            billingAddressAddition: null,
            billingCity:            'Vierkirchen',
            billingContactName:     null,
            billingCountry:         'DE',
            billingHouseNumber:     '46',
            billingName:            null,
            billingPostalCode:      '85256',
            billingStreet:          'Ganghofer Str.',
        });
    });

    it('takes further lines as recipient, contact person and addition', () => {
        expect(legacyBillingFields('Die Signatur\nPhilipp Schilli\nMeisenstraße 1B\n85368 Moosburg an der Isar', {name: 'Die Signatur (Philipp Schilli)'})).toMatchObject({
            billingAddressAddition: null,
            billingContactName:     'Philipp Schilli',
            billingName:            'Die Signatur',
        });
        expect(legacyBillingFields('Holding AG\nHans Meier\nBuchhaltung\nWeg 1\n12345 Ort', {contactName: 'Hans Meier', name: 'Tochter GmbH'})).toMatchObject({
            billingAddressAddition: 'Buchhaltung',
            billingContactName:     'Hans Meier',
            billingName:            'Holding AG',
        });
    });

    it('keeps an unrecognized address completely in the addition', () => {
        expect(legacyBillingFields('Postfach irgendwo', {name: 'Kunde'})).toMatchObject({billingAddressAddition: 'Postfach irgendwo', billingName: null, billingStreet: null});
    });

    it('leaves everything empty without an address', () => {
        expect(legacyBillingFields(null, {name: 'Kunde'})).toMatchObject({billingCity: null, billingCountry: 'DE', billingName: null, billingStreet: null});
    });
});

describe('legacyTenantAddress', () => {
    it('splits the company address and keeps other lines as addition', () => {
        expect(legacyTenantAddress('Marco Starker\nHinterhaus\nCarl-Thiemann-Straße 10\n85256 Vierkirchen', ['Marco Starker', null])).toEqual({
            addressAddition: 'Hinterhaus',
            city:            'Vierkirchen',
            country:         'DE',
            houseNumber:     '10',
            postalCode:      '85256',
            street:          'Carl-Thiemann-Straße',
        });
    });
});
