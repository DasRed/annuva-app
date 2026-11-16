import countryCodes from '@/address/countryCodes';
import countryName from '@/address/countryName';
import type PostalAddress from '@/address/PostalAddress';

/** Country prefixes in front of postal codes, e.g. "D-85256" or "A-1010". */
const POSTAL_PREFIXES: Readonly<Record<string, string>> = {A: 'AT', B: 'BE', CH: 'CH', D: 'DE', DK: 'DK', F: 'FR', I: 'IT', L: 'LU', NL: 'NL'};
const POSTAL_LINE = /^(?:([A-Z]{1,2})\s*[-–]\s*)?(\d{4,5})\s+(\S.*)$/;
const STREET_NUMBER_LAST = /^(.*\D)\s+(\d+\s*[a-zA-Z]?(?:\s*[-/]\s*\d+\s*[a-zA-Z]?)?)$/;
const STREET_NUMBER_FIRST = /^(\d+\s*[a-zA-Z]?)\s+(\D.*)$/;

let countries: Map<string, string> | null = null;

function countryOf(line: string): string | null {
    if (countries === null) {
        countries = new Map();
        for (const code of countryCodes) {
            for (const language of ['de', 'en']) {
                countries.set(countryName(code, language).toLocaleUpperCase('de'), code);
            }
        }
    }
    return countries.get(line.toLocaleUpperCase('de')) ?? null;
}

/**
 * Best-effort split of a free-text address (one part per line, or one line separated by commas)
 * into its parts. Recognized from the end: an optional country line, the postal code and city
 * ("85256 Vierkirchen", "D-85256 Vierkirchen") and the line above as street and house number.
 * Lines above the street are returned as `leading` (names, contact persons, additions) unless they
 * equal one of the `ignore` texts. If no postal line is found, `recognized` is false and everything
 * left ends up in `leading`.
 */
export default function parseLegacyAddress(text: string | null, ignore: readonly (string | null)[] = []): { address: PostalAddress; leading: string[]; recognized: boolean } {
    const address: PostalAddress = {addition: null, city: null, country: null, houseNumber: null, postalCode: null, street: null};
    let lines = (text ?? '').split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== '');
    if (lines.length === 1 && lines[0].includes(',')) {
        lines = lines[0].split(',').map((line) => line.trim()).filter((line) => line !== '');
    }

    if (lines.length > 1) {
        address.country = countryOf(lines[lines.length - 1]);
        if (address.country !== null) {
            lines.pop();
        }
    }

    const postal = lines.length > 0 ? POSTAL_LINE.exec(lines[lines.length - 1]) : null;
    if (postal !== null) {
        lines.pop();
        address.postalCode = postal[2];
        address.city = postal[3];
        if (postal[1] !== undefined && address.country === null) {
            address.country = POSTAL_PREFIXES[postal[1]] ?? null;
        }
        const street = lines.pop();
        if (street !== undefined) {
            const last = STREET_NUMBER_LAST.exec(street);
            const first = last === null ? STREET_NUMBER_FIRST.exec(street) : null;
            address.street = last?.[1] ?? first?.[2] ?? street;
            address.houseNumber = last?.[2] ?? first?.[1] ?? null;
        }
    }

    const ignored = ignore.filter((value): value is string => value !== null).map((value) => value.trim().toLocaleLowerCase());
    return {
        address,
        leading:    lines.filter((line) => !ignored.includes(line.toLocaleLowerCase())),
        recognized: postal !== null,
    };
}
