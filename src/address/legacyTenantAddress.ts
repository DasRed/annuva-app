import parseLegacyAddress from '@/address/parseLegacyAddress';

/**
 * Address fields of the tenant settings derived from the former free-text address. Lines repeating
 * the tenant or company name are dropped, other lines above the street become the addition.
 */
export default function legacyTenantAddress(text: string | null, names: readonly (string | null)[]): Record<string, string | null> {
    const {address, leading} = parseLegacyAddress(text, names);
    return {
        addressAddition: leading.length > 0 ? leading.join(', ').slice(0, 255) : null,
        city:            address.city,
        country:         address.country ?? 'DE',
        houseNumber:     address.houseNumber,
        postalCode:      address.postalCode,
        street:          address.street,
    };
}
