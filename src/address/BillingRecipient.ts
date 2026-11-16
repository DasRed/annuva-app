import type PostalAddress from '@/address/PostalAddress';

/**
 * Who an invoice is addressed to, after applying the fallbacks to the customer or partner data.
 */
export default interface BillingRecipient {
    address: PostalAddress;
    contact: string | null;
    email: string | null;
    name: string;
}
