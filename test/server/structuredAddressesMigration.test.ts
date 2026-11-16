import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Kysely, SqliteDialect} from 'kysely';
import {Migrator} from 'kysely/migration';
import {afterAll, describe, expect, it} from 'vitest';
import NodeSqliteDatabase from '@/server/db/NodeSqliteDatabase';
import migrations from '@/server/db/migrations/migrations';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'annuva-migration-'));
const now = '2026-11-16T10:00:00.000Z';

/**
 * Migration 0003 turns the free-text addresses into fields and back.
 */
describe('migration 0003_structured_addresses', () => {
    const db = new Kysely<any>({dialect: new SqliteDialect({database: new NodeSqliteDatabase(path.join(dir, 'test.sqlite'))})});
    const migrator = new Migrator({db, provider: {getMigrations: () => Promise.resolve(migrations)}});

    afterAll(async () => {
        await db.destroy();
        fs.rmSync(dir, {force: true, recursive: true});
    });

    it('splits the addresses of tenant, customers and partners', async () => {
        expect((await migrator.migrateTo('0002_signature_and_two_factor')).error).toBeUndefined();
        await db.insertInto('tenants').values({
            address:               'Carl-Thiemann-Straße 10\n85256 Vierkirchen',
            companyName:           'Marco Starker',
            createdAt:             now,
            currency:              'EUR',
            defaultHostingPerYear: 6_000,
            defaultHourlyRate:     8_000,
            defaultVatRate:        1_900,
            domainPassThrough:     'at_cost',
            id:                    't1',
            invoiceNumberFormat:   'RE-{YYYY}-{NNN}',
            locale:                'de-DE',
            name:                  'Marco Starker',
            recurringInvoiceMonth: 1,
            serverCostAllocation:  'none',
            taxPaymentMonth:       4,
            timezone:              'Europe/Berlin',
            updatedAt:             now,
            vatMode:               'small_business',
        }).execute();
        await db.insertInto('customers').values([
            {billingAddress: 'Michaela Hanisch\nGanghofer Str. 46\n85256 Vierkirchen', channel: 'direct', contactName: 'Michaela Hanisch', createdAt: now, id: 'c1', language: 'de', name: 'Michaela Hanisch', status: 'active', tenantId: 't1', updatedAt: now},
            {billingAddress: null, channel: 'direct', createdAt: now, id: 'c2', language: 'de', name: 'Ohne Adresse', status: 'active', tenantId: 't1', updatedAt: now},
        ]).execute();
        await db.insertInto('partners').values({
            billingAddress: 'Die Signatur\nPhilipp Schilli\nMeisenstraße 1B\n85368 Moosburg an der Isar',
            createdAt:      now,
            id:             'p1',
            name:           'Die Signatur (Philipp Schilli)',
            tenantId:       't1',
            updatedAt:      now,
        }).execute();

        expect((await migrator.migrateToLatest()).error).toBeUndefined();

        expect(await db.selectFrom('tenants').select(['street', 'houseNumber', 'postalCode', 'city', 'addressAddition', 'country']).executeTakeFirst())
            .toEqual({addressAddition: null, city: 'Vierkirchen', country: 'DE', houseNumber: '10', postalCode: '85256', street: 'Carl-Thiemann-Straße'});
        const customers = await db.selectFrom('customers').selectAll().orderBy('id').execute();
        expect(customers[0]).toMatchObject({billingCity: 'Vierkirchen', billingHouseNumber: '46', billingName: null, billingPostalCode: '85256', billingStreet: 'Ganghofer Str.'});
        expect(customers[0].billingAddress).toBeUndefined();
        expect(customers[1]).toMatchObject({billingCountry: 'DE', billingStreet: null});
        expect(await db.selectFrom('partners').selectAll().executeTakeFirst()).toMatchObject({
            billingContactName: 'Philipp Schilli',
            billingName:        'Die Signatur',
            billingStreet:      'Meisenstraße',
        });
    });

    it('joins the fields again when migrating down', async () => {
        expect((await migrator.migrateDown()).error).toBeUndefined();
        expect((await db.selectFrom('tenants').select('address').executeTakeFirst())?.address).toBe('Carl-Thiemann-Straße 10\n85256 Vierkirchen');
        expect((await db.selectFrom('partners').select('billingAddress').executeTakeFirst())?.billingAddress)
            .toBe('Die Signatur\nPhilipp Schilli\nMeisenstraße 1B\n85368 Moosburg an der Isar');
    });
});
