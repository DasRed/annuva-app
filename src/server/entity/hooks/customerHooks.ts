import type EntityHooks from '@/server/entity/EntityHooks';
import countReferences from '@/server/entity/countReferences';
import ApiError from '@/server/error/ApiError';

const references: ReadonlyArray<[string, string]> = [
    ['invoices', 'customerId'],
    ['invoiceLines', 'customerId'],
    ['offers', 'customerId'],
    ['recurringCharges', 'customerId'],
    ['recurringCosts', 'assignedTo'],
    ['expenses', 'assignedTo'],
    ['resources', 'customerId'],
    ['tasks', 'customerId'],
];

function normalizePartner(data: Record<string, unknown>): void {
    if (data.channel !== undefined && data.channel !== 'partner') {
        data.partnerId = null;
    }
}

const customerHooks: EntityHooks = {
    beforeCreate(context, data) {
        normalizePartner(data);
        if (data.channel === 'partner' && data.partnerId === null) {
            throw ApiError.badRequest('partner_required', 'Customers billed through a partner need a partner.', {field: 'partnerId'});
        }
        return Promise.resolve();
    },

    async beforeDelete(context, existing) {
        const found = await countReferences(existing.tenantId as string, existing.id as string, references);
        if (Object.keys(found).length > 0) {
            throw ApiError.conflict('customer_in_use', 'The customer still has linked records. Archive the customer instead.', found);
        }
    },

    beforeUpdate(context, existing, data) {
        normalizePartner(data);
        const channel = data.channel ?? existing.channel;
        const partnerId = data.partnerId !== undefined ? data.partnerId : existing.partnerId;
        if (channel === 'partner' && (partnerId === null || partnerId === undefined)) {
            throw ApiError.badRequest('partner_required', 'Customers billed through a partner need a partner.', {field: 'partnerId'});
        }
        return Promise.resolve();
    },
};

export default customerHooks;
