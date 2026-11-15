import type {Kysely} from 'kysely';
import getDb from '@/server/db/getDb';
import type EntityHooks from '@/server/entity/EntityHooks';
import ApiError from '@/server/error/ApiError';

async function assertUniqueYear(tenantId: string, year: unknown, id: unknown): Promise<void> {
    if (year === undefined) {
        return;
    }
    const db = (await getDb()) as unknown as Kysely<any>;
    const found = await db.selectFrom('taxYears').select('id').where('tenantId', '=', tenantId).where('year', '=', year).where('id', '!=', id).executeTakeFirst();
    if (found !== undefined) {
        throw ApiError.conflict('tax_year_exists', `Tax settings for ${String(year)} already exist.`, {field: 'year'});
    }
}

const taxYearHooks: EntityHooks = {
    beforeCreate: (context, data) => assertUniqueYear(data.tenantId as string, data.year, data.id),
    beforeUpdate: (context, existing, data) => assertUniqueYear(existing.tenantId as string, data.year, existing.id),
};

export default taxYearHooks;
