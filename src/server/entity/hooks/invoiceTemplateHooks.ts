import type {Kysely} from 'kysely';
import getDb from '@/server/db/getDb';
import type EntityHooks from '@/server/entity/EntityHooks';
import countReferences from '@/server/entity/countReferences';
import ApiError from '@/server/error/ApiError';

const invoiceTemplateHooks: EntityHooks = {
    async afterWrite(context, row) {
        if (row.isDefault !== 1) {
            return;
        }
        const db = (await getDb()) as unknown as Kysely<any>;
        await db.updateTable('invoiceTemplates')
                .set({isDefault: 0})
                .where('tenantId', '=', row.tenantId)
                .where('id', '!=', row.id)
                .execute();
    },

    async beforeDelete(context, existing) {
        const found = await countReferences(existing.tenantId as string, existing.id as string, [['invoices', 'templateId']]);
        if (Object.keys(found).length > 0) {
            throw ApiError.conflict('template_in_use', 'The template is used by invoices.', found);
        }
    },
};

export default invoiceTemplateHooks;
