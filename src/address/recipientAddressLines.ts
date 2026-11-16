import type BillingRecipient from '@/address/BillingRecipient';
import formatPostalAddress from '@/address/formatPostalAddress';

/**
 * Lines below the recipient's name in the address field: contact person and postal address.
 */
export default function recipientAddressLines(recipient: BillingRecipient, options: { homeCountry: string | null; language: string }): string[] {
    return [...(recipient.contact === null ? [] : [recipient.contact]), ...formatPostalAddress(recipient.address, options)];
}
