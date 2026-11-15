import type {Kysely} from 'kysely';
import {Migrator} from 'kysely/migration';
import migrations from '@/server/db/migrations/migrations';

/**
 * Runs all pending migrations. Safe to call on every start.
 */
export default async function migrate(db: Kysely<unknown>): Promise<string[]> {
    const migrator = new Migrator({
        db,
        provider: {
            getMigrations: () => Promise.resolve(migrations),
        },
    });
    const {error, results} = await migrator.migrateToLatest();
    if (error !== undefined) {
        throw error instanceof Error ? error : new Error(String(error));
    }
    return (results ?? []).filter((result) => result.status === 'Success').map((result) => result.migrationName);
}
