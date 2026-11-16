import type BillingRecipient from '@/address/BillingRecipient';
import postalAddressOf from '@/address/postalAddressOf';
import textOrNull from '@/address/textOrNull';

/**
 * The invoice recipient of a customer or partner record. Empty billing fields fall back to the
 * record: the name to `name`, the e-mail to `email` and the contact person to `contactName` – the
 * latter only when no different recipient is set, since the contact belongs to the record's own
 * company. A contact that only repeats the name is dropped.
 */
export default function resolveBillingRecipient(record: Record<string, unknown>): BillingRecipient {
    const billingName = textOrNull(record.billingName);
    const name = billingName ?? textOrNull(record.name) ?? '';
    const contact = textOrNull(record.billingContactName) ?? (billingName === null ? textOrNull(record.contactName) : null);
    return {
        address: postalAddressOf(record, 'billing'),
        contact: contact !== null && contact.toLocaleLowerCase() === name.toLocaleLowerCase() ? null : contact,
        email:   textOrNull(record.billingEmail) ?? textOrNull(record.email),
        name,
    };
}
