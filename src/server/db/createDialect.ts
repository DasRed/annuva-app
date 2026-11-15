import fs from 'node:fs';
import path from 'node:path';
import {type Dialect, MysqlDialect, PostgresDialect, SqliteDialect} from 'kysely';
import type DatabaseConfig from '@/server/config/DatabaseConfig';
import NodeSqliteDatabase from '@/server/db/NodeSqliteDatabase';

export default async function createDialect(config: DatabaseConfig): Promise<Dialect> {
    if (config.driver === 'mysql') {
        const {createPool} = await import('mysql2');
        const pool = config.url === null
            ? createPool({
                connectionLimit: 10,
                database:        config.database,
                host:            config.host,
                password:        config.password,
                port:            config.port,
                user:            config.user,
            })
            : createPool({connectionLimit: 10, uri: config.url});
        return new MysqlDialect({pool});
    }

    if (config.driver === 'postgres') {
        const {default: pg} = await import('pg');
        // bigint (count, sum) as number instead of string
        pg.types.setTypeParser(20, (value: string) => Number(value));
        const pool = config.url === null
            ? new pg.Pool({
                database: config.database,
                host:     config.host,
                max:      10,
                password: config.password,
                port:     config.port,
                user:     config.user,
            })
            : new pg.Pool({connectionString: config.url, max: 10});
        return new PostgresDialect({pool});
    }

    fs.mkdirSync(path.dirname(config.sqliteFile), {recursive: true});
    return new SqliteDialect({database: new NodeSqliteDatabase(config.sqliteFile)});
}
