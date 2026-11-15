import type {Kysely} from 'kysely';
import type EntityRecord from '@/entity/EntityRecord';
import writeAudit from '@/server/audit/writeAudit';
import assertTenant from '@/server/auth/assertTenant';
import assertWrite from '@/server/auth/assertWrite';
import type AuthContext from '@/server/auth/AuthContext';
import getDb from '@/server/db/getDb';
import EntityService from '@/server/entity/EntityService';
import ApiError from '@/server/error/ApiError';
import nowIso from '@/server/util/nowIso';

/**
 * Archives or restores a customer. A customer can only be archived when no recurring charges are
 * left, so no follow-up invoices can be created for it.
 */
export default async function setCustomerArchived(context: AuthContext, id: string, archived: boolean): Promise<EntityRecord> {
    assertWrite(context);
    const tenantId = assertTenant(context);
    const service = new EntityService('customers');
    await service.getRow(context, id);
    const db = (await getDb()) as unknown as Kysely<any>;

    if (archived) {
        const charges = await db.selectFrom('recurringCharges')
                                .select((eb) => eb.fn.countAll<number>().as('count'))
                                .where('tenantId', '=', tenantId)
                                .where('customerId', '=', id)
                                .executeTakeFirstOrThrow() as { count: number };
        if (Number(charges.count) > 0) {
            throw ApiError.conflict('customer_has_recurring_charges', 'Remove all recurring charges before archiving the customer.', {recurringCharges: Number(charges.count)});
        }
    }

    const now = nowIso();
    await db.updateTable('customers')
            .set({archivedAt: archived ? now : null, updatedAt: now})
            .where('tenantId', '=', tenantId)
            .where('id', '=', id)
            .execute();
    await writeAudit(context, archived ? 'archive' : 'unarchive', 'customers', id);
    return service.get(context, id);
}
