import {DatabaseSync} from 'node:sqlite';
import type {SqliteDatabase, SqliteStatement} from 'kysely';
import NodeSqliteStatement from '@/server/db/NodeSqliteStatement';

/**
 * Adapts the built-in `node:sqlite` module to the interface expected by Kysely's SQLite dialect.
 * Using the built-in driver avoids native modules, so the standalone build runs on any libc.
 */
export default class NodeSqliteDatabase implements SqliteDatabase {
    private readonly database: DatabaseSync;

    constructor(file: string) {
        this.database = new DatabaseSync(file);
        this.database.exec('PRAGMA journal_mode = WAL;');
        this.database.exec('PRAGMA foreign_keys = ON;');
        this.database.exec('PRAGMA busy_timeout = 5000;');
    }

    close(): void {
        this.database.close();
    }

    prepare(sql: string): SqliteStatement {
        return new NodeSqliteStatement(this.database.prepare(sql));
    }
}
