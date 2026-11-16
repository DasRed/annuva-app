import addressFieldNames from '@/address/addressFieldNames';
import type PostalAddress from '@/address/PostalAddress';
import textOrNull from '@/address/textOrNull';

/**
 * Reads the postal address fields of a record (see `addressFieldNames`).
 */
export default function postalAddressOf(record: Record<string, unknown>, prefix: '' | 'billing'): PostalAddress {
    const names = addressFieldNames(prefix);
    return {
        addition:    textOrNull(record[names.addition]),
        city:        textOrNull(record[names.city]),
        country:     textOrNull(record[names.country]),
        houseNumber: textOrNull(record[names.houseNumber]),
        postalCode:  textOrNull(record[names.postalCode]),
        street:      textOrNull(record[names.street]),
    };
}
