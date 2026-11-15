import {describe, expect, it} from 'vitest';
import buildSchema from '@/entity/buildSchema';
import entities from '@/entity/entities';
import fromDbValue from '@/entity/fromDbValue';
import toDbValue from '@/entity/toDbValue';
import parseConfig from '@/server/config/parseConfig';
import addMonths from '@/server/invoice/addMonths';
import calculateTotals from '@/server/invoice/calculateTotals';
import formatInvoiceNumber from '@/server/invoice/formatInvoiceNumber';

describe('formatInvoiceNumber', () => {
    it('replaces year, month and a zero-padded counter', () => {
        expect(formatInvoiceNumber('RE-{YYYY}-{NNN}', '2026-03-05', 7)).toBe('RE-2026-007');
        expect(formatInvoiceNumber('{YY}{MM}-{NNNNN}', '2026-03-05', 42)).toBe('2603-00042');
    });
});

describe('calculateTotals', () => {
    it('charges no VAT for small businesses', () => {
        expect(calculateTotals([{quantity: 150, taxRate: 1900, unitPrice: 8_000}], 'small_business')).toMatchObject({gross: 12_000, net: 12_000, tax: 0});
    });

    it('adds VAT per line for regular taxation', () => {
        expect(calculateTotals([{quantity: 100, taxRate: 1900, unitPrice: 10_000}, {quantity: 200, taxRate: 700, unitPrice: 1_000}], 'regular'))
            .toMatchObject({gross: 10_000 + 1_900 + 2_000 + 140, net: 12_000, tax: 2_040});
    });
});

describe('addMonths', () => {
    it('clamps to the end of the month', () => {
        expect(addMonths('2025-01-31', 1)).toBe('2025-02-28');
        expect(addMonths('2025-11-15', 3)).toBe('2026-02-15');
        expect(addMonths('2026-01-01', 12)).toBe('2027-01-01');
    });
});

describe('entity values', () => {
    const money = entities.recurringCharges.fields.find((field) => field.name === 'amountPerYear')!;

    it('stores money as cents and returns decimals', () => {
        expect(toDbValue(money, 60.5)).toBe(6_050);
        expect(fromDbValue(money, 6_050)).toBe(60.5);
    });

    it('validates create input from the field definitions', () => {
        const schema = buildSchema(entities.recurringCharges.fields, 'create');
        expect(schema.safeParse({amountPerYear: 60, customerId: '6f1c3a8e-2a4b-4d5e-9f00-112233445566', nextInvoiceDate: '2026-01-01', service: 'hosting'}).success).toBe(true);
        expect(schema.safeParse({amountPerYear: 60, nextInvoiceDate: '2026-01-01', service: 'hosting'}).success).toBe(false);
        expect(schema.safeParse({amountPerYear: 60.001, customerId: '6f1c3a8e-2a4b-4d5e-9f00-112233445566', nextInvoiceDate: '2026-01-01', service: 'hosting'}).success).toBe(false);
        expect(schema.safeParse({amountPerYear: 60, customerId: '6f1c3a8e-2a4b-4d5e-9f00-112233445566', nextInvoiceDate: '2026-01-01', service: 'hosting', unknown: 1}).success).toBe(false);
    });
});

describe('parseConfig', () => {
    it('starts with sensible defaults', () => {
        const config = parseConfig({});
        expect(config.appMode).toBe('single');
        expect(config.database.driver).toBe('sqlite');
        expect(config.database.sqliteFile.endsWith('data/annuva.sqlite')).toBe(true);
        expect(config.smtp).toBeNull();
        expect(config.uploadMaxSize).toBe(20 * 1024 * 1024);
    });

    it('rejects invalid values', () => {
        expect(() => parseConfig({DB_DRIVER: 'oracle'})).toThrow(/DB_DRIVER/);
        expect(() => parseConfig({GRAVATAR_ENABLED: 'maybe'})).toThrow(/GRAVATAR_ENABLED/);
    });
});
