import formatPostalAddress from '@/address/formatPostalAddress';
import postalAddressOf from '@/address/postalAddressOf';
import type TenantTable from '@/server/db/table/TenantTable';
import type InvoiceSnapshot from '@/server/invoice/InvoiceSnapshot';

/**
 * The tenant data printed on an invoice. The country of the address is only printed when the
 * recipient lives in another country.
 */
export default function snapshotTenant(tenant: TenantTable, options: { language: string; recipientCountry: string | null }): InvoiceSnapshot['tenant'] {
    const address = formatPostalAddress(postalAddressOf(tenant as unknown as Record<string, unknown>, ''), {
        homeCountry: options.recipientCountry ?? tenant.country,
        language:    options.language,
    });
    return {
        address:     address.length === 0 ? null : address.join('\n'),
        bankName:    tenant.bankName,
        bic:         tenant.bic,
        companyName: tenant.companyName ?? tenant.name,
        email:       tenant.email,
        iban:        tenant.iban,
        phone:       tenant.phone,
        taxNumber:   tenant.taxNumber,
        vatId:       tenant.vatId,
        website:     tenant.website,
    };
}
