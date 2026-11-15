import {Kysely} from 'kysely';
import getConfig from '@/server/config/getConfig';
import createDialect from '@/server/db/createDialect';
import type Database from '@/server/db/Database';

const globalState = globalThis as unknown as { annuvaDb?: Promise<Kysely<Database>> };

/**
 * Returns the shared database connection. The instance lives on `globalThis` so hot reloads in
 * development do not open a new pool on every change.
 */
export default function getDb(): Promise<Kysely<Database>> {
    if (globalState.annuvaDb === undefined) {
        globalState.annuvaDb = createDialect(getConfig().database).then((dialect) => new Kysely<Database>({dialect}));
    }
    return globalState.annuvaDb;
}
