import type PostalAddress from '@/address/PostalAddress';

/**
 * Field names of a postal address on a record: without prefix for the tenant settings
 * (`street`, `addressAddition`, …), with the prefix "billing" for customers and partners
 * (`billingStreet`, `billingAddressAddition`, …).
 */
export default function addressFieldNames(prefix: '' | 'billing'): Record<keyof PostalAddress, string> {
    const name = (part: string) => (prefix === '' ? part : `${prefix}${part[0].toUpperCase()}${part.slice(1)}`);
    return {
        addition:    name('addressAddition'),
        city:        name('city'),
        country:     name('country'),
        houseNumber: name('houseNumber'),
        postalCode:  name('postalCode'),
        street:      name('street'),
    };
}
