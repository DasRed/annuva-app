import type {Kysely} from 'kysely';
import getDb from '@/server/db/getDb';

/**
 * Counts rows of the given tables that point to `id`, per table. Used to prevent deletes that would
 * leave orphaned or legally required records behind.
 */
export default async function countReferences(tenantId: string, id: string, references: ReadonlyArray<[table: string, column: string]>): Promise<Record<string, number>> {
    const db = (await getDb()) as unknown as Kysely<any>;
    const result: Record<string, number> = {};
    for (const [table, column] of references) {
        const row = await db.selectFrom(table)
                            .select((eb) => eb.fn.countAll<number>().as('count'))
                            .where('tenantId', '=', tenantId)
                            .where(column, '=', id)
                            .executeTakeFirstOrThrow() as { count: number };
        if (Number(row.count) > 0) {
            result[table] = Number(row.count);
        }
    }
    return result;
}
