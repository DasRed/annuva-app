import addressFieldNames from '@/address/addressFieldNames';
import missingAddressParts from '@/address/missingAddressParts';
import postalAddressOf from '@/address/postalAddressOf';
import ApiError from '@/server/error/ApiError';

type Row = Record<string, unknown>;

/**
 * Rejects a customer or partner whose billing address has been started but lacks street, postal
 * code or city (see `missingAddressParts`). `changes` are applied on top of `existing`.
 */
export default function assertCompleteBillingAddress(existing: Row, changes: Row): void {
    const missing = missingAddressParts(postalAddressOf({...existing, ...changes}, 'billing'));
    if (missing.length > 0) {
        const names = addressFieldNames('billing');
        throw ApiError.badRequest(
            'billing_address_incomplete',
            'Street, postal code and city are required once a billing address is entered.',
            missing.map((part) => ({field: names[part], message: 'Required once a billing address is entered.'})),
        );
    }
}
