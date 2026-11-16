import countryName from '@/address/countryName';
import type PostalAddress from '@/address/PostalAddress';

/** Countries that write the house number in front of the street. */
const NUMBER_FIRST: readonly string[] = ['AU', 'CA', 'FR', 'GB', 'IE', 'LU', 'NZ', 'US'];
/** Countries that write the city in front of the postal code. */
const CITY_FIRST: readonly string[] = ['AU', 'CA', 'GB', 'IE', 'NZ', 'US'];

function join(parts: (string | null)[]): string | null {
    const filled = parts.filter((part): part is string => part !== null);
    return filled.length === 0 ? null : filled.join(' ');
}

/**
 * Lines of a postal address: addition, street and house number, postal code and city, and the
 * country in capitals when it differs from the home country (the sender's country for a recipient
 * and vice versa). Street and postal line follow the conventions of the address's country.
 */
export default function formatPostalAddress(address: PostalAddress, options: { homeCountry: string | null; language: string }): string[] {
    const country = address.country ?? options.homeCountry ?? 'DE';
    const street = NUMBER_FIRST.includes(country) ? join([address.houseNumber, address.street]) : join([address.street, address.houseNumber]);
    const postal = CITY_FIRST.includes(country) ? join([address.city, address.postalCode]) : join([address.postalCode, address.city]);
    const lines = [address.addition, street, postal].filter((line): line is string => line !== null);
    if (lines.length > 0 && address.country !== null && options.homeCountry !== null && address.country !== options.homeCountry) {
        lines.push(countryName(address.country, options.language).toLocaleUpperCase(options.language));
    }
    return lines;
}
