import type {Migration} from 'kysely/migration';
import initial from '@/server/db/migrations/0001_initial';

/**
 * All migrations in order. Migrations are registered statically, so they are part of the
 * standalone bundle and need no file system lookup at runtime. Never change a released migration;
 * add a new one instead.
 */
const migrations: Record<string, Migration> = {
    '0001_initial': initial,
};

export default migrations;
