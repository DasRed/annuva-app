import type {Kysely} from 'kysely';
import getDb from '@/server/db/getDb';
import type EntityHooks from '@/server/entity/EntityHooks';
import ApiError from '@/server/error/ApiError';

async function assertCustomerActive(tenantId: string, customerId: unknown): Promise<void> {
    if (customerId === undefined) {
        return;
    }
    const db = (await getDb()) as unknown as Kysely<any>;
    const customer = await db.selectFrom('customers').select('archivedAt').where('tenantId', '=', tenantId).where('id', '=', customerId).executeTakeFirst();
    if (customer !== undefined && customer.archivedAt !== null) {
        throw ApiError.conflict('customer_archived', 'Archived customers cannot receive recurring charges.', {field: 'customerId'});
    }
}

const recurringChargeHooks: EntityHooks = {
    beforeCreate: (context, data) => assertCustomerActive(data.tenantId as string, data.customerId),
    beforeUpdate: (context, existing, data) => assertCustomerActive(existing.tenantId as string, data.customerId),
};

export default recurringChargeHooks;
