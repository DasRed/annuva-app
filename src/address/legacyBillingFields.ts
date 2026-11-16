import parseLegacyAddress from '@/address/parseLegacyAddress';

/**
 * Billing fields of a customer or partner derived from the former free-text billing address.
 * Lines repeating the record's name are dropped. Of the remaining lines above the street the first
 * becomes the billing recipient, the next the contact person (a line equal to the record's contact
 * person is taken as contact right away) and the rest the address addition. Text that cannot be
 * recognized as an address is kept completely in the addition, so nothing gets lost.
 */
export default function legacyBillingFields(text: string | null, record: { contactName?: string | null; name: string }): Record<string, string | null> {
    const {address, leading, recognized} = parseLegacyAddress(text, [record.name]);
    const contactName = record.contactName?.trim().toLocaleLowerCase() ?? null;
    let name: string | null = null;
    let contact: string | null = null;
    const additions: string[] = [];
    for (const line of leading) {
        if (!recognized) {
            additions.push(line);
        }
        else if (contact === null && line.toLocaleLowerCase() === contactName) {
            contact = line;
        }
        else if (name === null) {
            name = line;
        }
        else if (contact === null) {
            contact = line;
        }
        else {
            additions.push(line);
        }
    }
    // without a different recipient the contact person of the record is used anyway
    if (name === null && contact !== null && contact.toLocaleLowerCase() === contactName) {
        contact = null;
    }
    return {
        billingAddressAddition: additions.length > 0 ? additions.join(', ').slice(0, 255) : null,
        billingCity:            address.city,
        billingContactName:     contact,
        billingCountry:         address.country ?? 'DE',
        billingHouseNumber:     address.houseNumber,
        billingName:            name,
        billingPostalCode:      address.postalCode,
        billingStreet:          address.street,
    };
}
