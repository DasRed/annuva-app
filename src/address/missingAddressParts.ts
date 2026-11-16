import type PostalAddress from '@/address/PostalAddress';

/**
 * Parts that are still missing once an address has been started: as soon as street, house number,
 * addition, postal code or city is filled, street, postal code and city are required. The country
 * alone does not start an address.
 */
export default function missingAddressParts(address: PostalAddress): ('city' | 'postalCode' | 'street')[] {
    const started = [address.street, address.houseNumber, address.addition, address.postalCode, address.city].some((part) => part !== null);
    if (!started) {
        return [];
    }
    return (['street', 'postalCode', 'city'] as const).filter((part) => address[part] === null);
}
