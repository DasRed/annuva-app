import type EntityHooks from '@/server/entity/EntityHooks';
import countReferences from '@/server/entity/countReferences';
import assertCompleteBillingAddress from '@/server/entity/hooks/assertCompleteBillingAddress';
import ApiError from '@/server/error/ApiError';

const partnerHooks: EntityHooks = {
    beforeCreate(context, data) {
        assertCompleteBillingAddress({}, data);
        return Promise.resolve();
    },

    async beforeDelete(context, existing) {
        const found = await countReferences(existing.tenantId as string, existing.id as string, [['customers', 'partnerId'], ['invoices', 'partnerId']]);
        if (Object.keys(found).length > 0) {
            throw ApiError.conflict('partner_in_use', 'The partner is still used by customers or invoices.', found);
        }
    },

    beforeUpdate(context, existing, data) {
        assertCompleteBillingAddress(existing, data);
        return Promise.resolve();
    },
};

export default partnerHooks;
