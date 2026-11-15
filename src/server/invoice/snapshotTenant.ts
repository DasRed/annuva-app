import type TenantTable from '@/server/db/table/TenantTable';
import type InvoiceSnapshot from '@/server/invoice/InvoiceSnapshot';

/**
 * The tenant data printed on an invoice.
 */
export default function snapshotTenant(tenant: TenantTable): InvoiceSnapshot['tenant'] {
    return {
        address:     tenant.address,
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
