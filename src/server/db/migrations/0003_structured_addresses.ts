import type {Kysely} from 'kysely';
import type {Migration} from 'kysely/migration';
import legacyBillingFields from '@/address/legacyBillingFields';
import legacyTenantAddress from '@/address/legacyTenantAddress';

type Row = Record<string, unknown>;

const billingColumns: ReadonlyArray<[name: string, type: 'varchar(2)' | 'varchar(16)' | 'varchar(32)' | 'varchar(255)']> = [
    ['billingName', 'varchar(255)'],
    ['billingContactName', 'varchar(255)'],
    ['billingStreet', 'varchar(255)'],
    ['billingHouseNumber', 'varchar(32)'],
    ['billingPostalCode', 'varchar(16)'],
    ['billingCity', 'varchar(255)'],
    ['billingAddressAddition', 'varchar(255)'],
    ['billingCountry', 'varchar(2)'],
    ['billingEmail', 'varchar(255)'],
];

const tenantColumns: ReadonlyArray<[name: string, type: 'varchar(2)' | 'varchar(16)' | 'varchar(32)' | 'varchar(255)']> = [
    ['street', 'varchar(255)'],
    ['houseNumber', 'varchar(32)'],
    ['postalCode', 'varchar(16)'],
    ['city', 'varchar(255)'],
    ['addressAddition', 'varchar(255)'],
    ['country', 'varchar(2)'],
];

const text = (value: unknown) => (typeof value === 'string' ? value : null);

/**
 * Structured addresses: the free-text billing address of customers and partners and the address of
 * the tenant become separate fields (street, house number, postal code, city, addition, country).
 * Customers and partners also get a different billing recipient, contact person and e-mail. The old
 * text is split as well as possible (see `legacyBillingFields`, `legacyTenantAddress`); the down
 * migration joins the fields again.
 */
const structuredAddresses: Migration = {
    async down(db: Kysely<unknown>): Promise<void> {
        const any = db as Kysely<any>;
        for (const table of ['customers', 'partners']) {
            await db.schema.alterTable(table).addColumn('billingAddress', 'text').execute();
            for (const row of await any.selectFrom(table).selectAll().execute() as Row[]) {
                const lines = [
                    row.billingName,
                    row.billingContactName,
                    row.billingAddressAddition,
                    [row.billingStreet, row.billingHouseNumber].filter(Boolean).join(' '),
                    [row.billingPostalCode, row.billingCity].filter(Boolean).join(' '),
                ].filter(Boolean);
                await any.updateTable(table).set({billingAddress: lines.length === 0 ? null : lines.join('\n')}).where('id', '=', row.id).execute();
            }
            for (const [name] of billingColumns) {
                await db.schema.alterTable(table).dropColumn(name).execute();
            }
        }
        await db.schema.alterTable('tenants').addColumn('address', 'text').execute();
        for (const row of await any.selectFrom('tenants').selectAll().execute() as Row[]) {
            const lines = [
                row.addressAddition,
                [row.street, row.houseNumber].filter(Boolean).join(' '),
                [row.postalCode, row.city].filter(Boolean).join(' '),
            ].filter(Boolean);
            await any.updateTable('tenants').set({address: lines.length === 0 ? null : lines.join('\n')}).where('id', '=', row.id).execute();
        }
        for (const [name] of tenantColumns) {
            await db.schema.alterTable('tenants').dropColumn(name).execute();
        }
    },

    async up(db: Kysely<unknown>): Promise<void> {
        const any = db as Kysely<any>;
        for (const table of ['customers', 'partners']) {
            for (const [name, type] of billingColumns) {
                await db.schema.alterTable(table).addColumn(name, type).execute();
            }
            for (const row of await any.selectFrom(table).selectAll().execute() as Row[]) {
                const fields = legacyBillingFields(text(row.billingAddress), {contactName: text(row.contactName), name: String(row.name)});
                await any.updateTable(table).set(fields).where('id', '=', row.id).execute();
            }
            await db.schema.alterTable(table).dropColumn('billingAddress').execute();
        }

        for (const [name, type] of tenantColumns) {
            await db.schema.alterTable('tenants').addColumn(name, type).execute();
        }
        for (const row of await any.selectFrom('tenants').selectAll().execute() as Row[]) {
            const fields = legacyTenantAddress(text(row.address), [text(row.name), text(row.companyName)]);
            await any.updateTable('tenants').set(fields).where('id', '=', row.id).execute();
        }
        await db.schema.alterTable('tenants').dropColumn('address').execute();
    },
};

export default structuredAddresses;
