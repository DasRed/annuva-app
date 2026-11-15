import buildSchema from '@/entity/buildSchema';
import fromDbValue from '@/entity/fromDbValue';
import settingsFields from '@/entity/settingsFields';
import toDbValue from '@/entity/toDbValue';
import writeAudit from '@/server/audit/writeAudit';
import assertAdmin from '@/server/auth/assertAdmin';
import assertTenant from '@/server/auth/assertTenant';
import assertWrite from '@/server/auth/assertWrite';
import type AuthContext from '@/server/auth/AuthContext';
import getConfig from '@/server/config/getConfig';
import getDb from '@/server/db/getDb';
import type TenantTable from '@/server/db/table/TenantTable';
import ApiError from '@/server/error/ApiError';
import newId from '@/server/util/newId';
import nowIso from '@/server/util/nowIso';

type Settings = Record<string, unknown>;

/**
 * Tenant record and its business settings (company data, invoicing, tax).
 */
export default class TenantService {
    async create(input: Settings): Promise<TenantTable> {
        const parsed = this.parse(input, 'create');
        const now = nowIso();
        const row: Record<string, unknown> = {createdAt: now, id: newId(), setupCompletedAt: null, updatedAt: now};
        for (const field of settingsFields) {
            const value = parsed[field.name] !== undefined ? parsed[field.name] : (field.default ?? null);
            row[field.name] = toDbValue(field, value);
        }
        if (row.timezone === null) {
            row.timezone = getConfig().defaultTimezone;
        }
        const db = await getDb();
        await db.insertInto('tenants').values(row as unknown as TenantTable).execute();
        return row as unknown as TenantTable;
    }

    async getRow(tenantId: string): Promise<TenantTable> {
        const db = await getDb();
        const tenant = await db.selectFrom('tenants').selectAll().where('id', '=', tenantId).executeTakeFirst();
        if (tenant === undefined) {
            throw ApiError.notFound('Tenant not found.');
        }
        return tenant;
    }

    async getSettings(context: AuthContext): Promise<Settings> {
        return this.toApi(await this.getRow(assertTenant(context)));
    }

    toApi(tenant: TenantTable): Settings {
        const settings: Settings = {id: tenant.id, setupCompletedAt: tenant.setupCompletedAt};
        for (const field of settingsFields) {
            settings[field.name] = fromDbValue(field, (tenant as unknown as Record<string, unknown>)[field.name]);
        }
        return settings;
    }

    async updateSettings(context: AuthContext, input: unknown): Promise<Settings> {
        assertWrite(context);
        assertAdmin(context);
        const tenantId = assertTenant(context);
        const parsed = this.parse(input, 'update');
        const changes: Record<string, unknown> = {updatedAt: nowIso()};
        for (const field of settingsFields) {
            if (parsed[field.name] !== undefined) {
                changes[field.name] = toDbValue(field, parsed[field.name]);
            }
        }
        if (typeof changes.invoiceNumberFormat === 'string' && !changes.invoiceNumberFormat.includes('{N')) {
            throw ApiError.badRequest('invalid_number_format', 'The invoice number format needs a counter placeholder like {NNN}.', {field: 'invoiceNumberFormat'});
        }
        const db = await getDb();
        await db.updateTable('tenants').set(changes).where('id', '=', tenantId).execute();
        await writeAudit(context, 'update', 'settings', tenantId, parsed);
        return this.getSettings(context);
    }

    private parse(input: unknown, mode: 'create' | 'update'): Settings {
        const result = buildSchema(settingsFields, mode).safeParse(input ?? {});
        if (!result.success) {
            throw ApiError.badRequest('validation_failed', 'The data is invalid.', result.error.issues.map((issue) => ({
                field:   issue.path.join('.'),
                message: issue.message,
            })));
        }
        return result.data as Settings;
    }
}
