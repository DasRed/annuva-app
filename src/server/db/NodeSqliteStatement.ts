import type {SQLInputValue, StatementSync} from 'node:sqlite';
import type {SqliteStatement} from 'kysely';

function bind(parameters: ReadonlyArray<unknown>): SQLInputValue[] {
    return parameters.map((value) => {
        if (value === undefined || value === null) {
            return null;
        }
        if (typeof value === 'boolean') {
            return value ? 1 : 0;
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value as SQLInputValue;
    });
}

/**
 * node:sqlite returns rows with a null prototype; React cannot pass those to client components.
 */
function plain(row: unknown): unknown {
    return row !== null && typeof row === 'object' ? {...row} : row;
}

export default class NodeSqliteStatement implements SqliteStatement {
    readonly reader: boolean;

    constructor(private readonly statement: StatementSync) {
        this.reader = statement.columns().length > 0;
    }

    all(parameters: ReadonlyArray<unknown>): unknown[] {
        return this.statement.all(...bind(parameters)).map(plain);
    }

    iterate(parameters: ReadonlyArray<unknown>): IterableIterator<unknown> {
        const rows = this.statement.iterate(...bind(parameters));
        return (function* () {
            for (const row of rows) {
                yield plain(row);
            }
        })();
    }

    run(parameters: ReadonlyArray<unknown>): { changes: number | bigint; lastInsertRowid: number | bigint } {
        return this.statement.run(...bind(parameters));
    }
}
