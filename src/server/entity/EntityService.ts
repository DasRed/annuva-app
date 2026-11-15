import {type Kysely, sql} from 'kysely';
import buildSchema from '@/entity/buildSchema';
import entities from '@/entity/entities';
import type EntityDefinition from '@/entity/EntityDefinition';
import type EntityName from '@/entity/EntityName';
import type EntityRecord from '@/entity/EntityRecord';
import fromDbValue from '@/entity/fromDbValue';
import type ListQuery from '@/entity/ListQuery';
import type ListResult from '@/entity/ListResult';
import toDbValue from '@/entity/toDbValue';
import writeAudit from '@/server/audit/writeAudit';
import assertAdmin from '@/server/auth/assertAdmin';
import assertTenant from '@/server/auth/assertTenant';
import assertWrite from '@/server/auth/assertWrite';
import type AuthContext from '@/server/auth/AuthContext';
import getDb from '@/server/db/getDb';
import hookRegistry from '@/server/entity/hookRegistry';
import ApiError from '@/server/error/ApiError';
import newId from '@/server/util/newId';
import nowIso from '@/server/util/nowIso';

type Row = Record<string, unknown>;

const MAX_LIMIT = 1000;

/**
 * Generic, tenant-scoped CRUD for every entity described in `src/entity/definitions`. UI, REST API
 * and MCP server all go through this service, so validation, permissions and audit logging are the
 * same everywhere.
 */
export default class EntityService {
    readonly definition: EntityDefinition;

    constructor(readonly name: EntityName) {
        this.definition = entities[name];
    }

    async create(context: AuthContext, input: unknown): Promise<EntityRecord> {
        this.assertWritable(context);
        const tenantId = assertTenant(context);
        const parsed = this.parse(input, 'create');
        const db = await this.db();
        const now = nowIso();
        const row: Row = {createdAt: now, id: newId(), tenantId, updatedAt: now};
        for (const field of this.definition.fields) {
            if (field.readOnly === true) {
                continue;
            }
            const value = parsed[field.name] !== undefined ? parsed[field.name] : (field.default ?? null);
            row[field.name] = toDbValue(field, value);
        }
        await this.assertReferences(context, row);
        await hookRegistry[this.name]?.beforeCreate?.(context, row);
        await db.insertInto(this.definition.table).values(row).execute();
        await hookRegistry[this.name]?.afterWrite?.(context, row);
        await writeAudit(context, 'create', this.name, row.id as string, parsed);
        return this.toApi(row);
    }

    async get(context: AuthContext, id: string): Promise<EntityRecord> {
        return this.toApi(await this.getRow(context, id));
    }

    async getRow(context: AuthContext, id: string): Promise<Row> {
        const tenantId = assertTenant(context);
        const db = await this.db();
        const row = await db.selectFrom(this.definition.table).selectAll().where('id', '=', id).where('tenantId', '=', tenantId).executeTakeFirst();
        if (row === undefined) {
            throw ApiError.notFound(`${this.definition.singular} ${id} not found.`);
        }
        return row as Row;
    }

    async list(context: AuthContext, query: ListQuery = {}): Promise<ListResult> {
        const tenantId = assertTenant(context);
        const db = await this.db();
        const limit = Math.min(Math.max(query.limit ?? 100, 1), MAX_LIMIT);
        const offset = Math.max(query.offset ?? 0, 0);

        let builder = db.selectFrom(this.definition.table).where('tenantId', '=', tenantId);
        if (query.customerId !== undefined && this.definition.customerField !== undefined) {
            builder = builder.where(this.definition.customerField, '=', query.customerId);
        }
        if (this.name === 'customers' && query.includeArchived !== true) {
            builder = builder.where('archivedAt', 'is', null);
        }
        for (const [name, value] of Object.entries(query.filters ?? {})) {
            const field = this.definition.fields.find((candidate) => candidate.name === name);
            if (field === undefined) {
                throw ApiError.badRequest('invalid_filter', `Unknown filter field "${name}".`);
            }
            builder = value === '' || value === 'null'
                ? builder.where(name, 'is', null)
                : builder.where(name, '=', toDbValue(field, field.type === 'boolean' ? value === 'true' : value));
        }
        const search = query.q?.trim();
        if (search !== undefined && search !== '') {
            const searchable = this.definition.fields.filter((field) => ['string', 'email', 'text'].includes(field.type)).map((field) => field.name);
            const pattern = `%${search.toLowerCase()}%`;
            builder = builder.where((eb) => eb.or(searchable.map((name) => eb(sql`lower(${sql.ref(name)})`, 'like', pattern))));
        }

        const {total} = await builder.select((eb) => eb.fn.countAll<number>().as('total')).executeTakeFirstOrThrow() as { total: number };
        const sort = this.sortField(query.sort);
        const order = query.order ?? (query.sort === undefined ? this.definition.defaultSort.direction : 'asc');
        const rows = await builder.selectAll().orderBy(sort, order).orderBy('id', 'asc').limit(limit).offset(offset).execute();

        return {items: rows.map((row) => this.toApi(row as Row)), limit, offset, total: Number(total)};
    }

    async remove(context: AuthContext, id: string): Promise<void> {
        this.assertWritable(context);
        const existing = await this.getRow(context, id);
        await hookRegistry[this.name]?.beforeDelete?.(context, existing);
        const db = await this.db();
        await db.deleteFrom(this.definition.table).where('id', '=', id).where('tenantId', '=', existing.tenantId as string).execute();
        await writeAudit(context, 'delete', this.name, id);
    }

    toApi(row: Row): EntityRecord {
        const record: Row = {createdAt: row.createdAt, id: row.id, updatedAt: row.updatedAt};
        for (const field of this.definition.fields) {
            record[field.name] = fromDbValue(field, row[field.name]);
        }
        return record as EntityRecord;
    }

    async update(context: AuthContext, id: string, input: unknown): Promise<EntityRecord> {
        this.assertWritable(context);
        const existing = await this.getRow(context, id);
        const parsed = this.parse(input, 'update');
        const changes: Row = {};
        for (const field of this.definition.fields) {
            if (field.readOnly !== true && parsed[field.name] !== undefined) {
                changes[field.name] = toDbValue(field, parsed[field.name]);
            }
        }
        changes.updatedAt = nowIso();
        const merged = {...existing, ...changes};
        await this.assertReferences(context, changes);
        await hookRegistry[this.name]?.beforeUpdate?.(context, existing, changes);
        const db = await this.db();
        await db.updateTable(this.definition.table).set(changes).where('id', '=', id).where('tenantId', '=', existing.tenantId as string).execute();
        await hookRegistry[this.name]?.afterWrite?.(context, {...merged, ...changes});
        await writeAudit(context, 'update', this.name, id, parsed);
        return this.toApi({...merged, ...changes});
    }

    private async assertReferences(context: AuthContext, row: Row): Promise<void> {
        const tenantId = assertTenant(context);
        const db = await this.db();
        for (const field of this.definition.fields) {
            const value = row[field.name];
            if (value === null || value === undefined || (field.type !== 'relation' && field.type !== 'file')) {
                continue;
            }
            const table = field.type === 'file' ? 'files' : entities[field.relation!].table;
            const found = await db.selectFrom(table).select('id').where('id', '=', value).where('tenantId', '=', tenantId).executeTakeFirst();
            if (found === undefined) {
                throw ApiError.badRequest('invalid_reference', `${field.name} references an unknown record.`, {field: field.name});
            }
        }
    }

    private assertWritable(context: AuthContext): void {
        assertWrite(context);
        if (this.definition.customWrite === true) {
            throw new ApiError(405, 'method_not_allowed', `Use the dedicated endpoints to change ${this.name}.`);
        }
        if (this.definition.adminOnly === true) {
            assertAdmin(context);
        }
    }

    private async db(): Promise<Kysely<any>> {
        return (await getDb()) as unknown as Kysely<any>;
    }

    private parse(input: unknown, mode: 'create' | 'update'): Row {
        const result = buildSchema(this.definition.fields, mode).safeParse(input ?? {});
        if (!result.success) {
            throw ApiError.badRequest('validation_failed', 'The data is invalid.', result.error.issues.map((issue) => ({
                field:   issue.path.join('.'),
                message: issue.message,
            })));
        }
        return result.data as Row;
    }

    private sortField(sort: string | undefined): string {
        if (sort === undefined) {
            return this.definition.defaultSort.field;
        }
        if (['createdAt', 'updatedAt'].includes(sort) || this.definition.fields.some((field) => field.name === sort)) {
            return sort;
        }
        throw ApiError.badRequest('invalid_sort', `Cannot sort by "${sort}".`);
    }
}
