import type {CreateTableBuilder, Kysely} from 'kysely';
import type {Migration} from 'kysely/migration';

type Column = [name: string, kind: 'bool' | 'date' | 'datetime' | 'id' | 'int' | 'string' | 'text', notNull?: boolean];

function columns(builder: CreateTableBuilder<string>, list: Column[]): CreateTableBuilder<string> {
    let result = builder;
    for (const [name, kind, notNull] of list) {
        const type = {
            bool:     'integer',
            date:     'varchar(10)',
            datetime: 'varchar(32)',
            id:       'varchar(36)',
            int:      'integer',
            string:   'varchar(255)',
            text:     'text',
        }[kind];
        result = result.addColumn(name, type as 'text', (column) => (notNull === true ? column.notNull() : column));
    }
    return result;
}

async function entityTable(db: Kysely<unknown>, table: string, list: Column[]): Promise<void> {
    await columns(
        db.schema.createTable(table)
          .addColumn('id', 'varchar(36)', (column) => column.primaryKey())
          .addColumn('tenantId', 'varchar(36)', (column) => column.notNull()),
        [...list, ['createdAt', 'datetime', true], ['updatedAt', 'datetime', true]],
    ).execute();
    await db.schema.createIndex(`${table}_tenant_idx`).on(table).column('tenantId').execute();
}

const tables = [
    'auditLog', 'invoiceLines', 'invoices', 'invoiceSequences', 'invoiceTemplates', 'taxAdjustments', 'taxYears', 'tasks', 'expenses',
    'recurringCosts', 'recurringCharges', 'offers', 'resources', 'customers', 'partners', 'files', 'passwordResets', 'apiTokens', 'sessions',
    'users', 'tenants',
];

const initial: Migration = {
    async down(db: Kysely<unknown>): Promise<void> {
        for (const table of tables) {
            await db.schema.dropTable(table).ifExists().execute();
        }
    },

    async up(db: Kysely<unknown>): Promise<void> {
        await columns(db.schema.createTable('tenants').addColumn('id', 'varchar(36)', (column) => column.primaryKey()), [
            ['name', 'string', true],
            ['companyName', 'string'],
            ['address', 'text'],
            ['email', 'string'],
            ['phone', 'string'],
            ['website', 'string'],
            ['taxNumber', 'string'],
            ['vatId', 'string'],
            ['bankName', 'string'],
            ['iban', 'string'],
            ['bic', 'string'],
            ['vatMode', 'string', true],
            ['defaultVatRate', 'int', true],
            ['currency', 'string', true],
            ['locale', 'string', true],
            ['timezone', 'string', true],
            ['defaultHourlyRate', 'int', true],
            ['defaultHostingPerYear', 'int', true],
            ['invoiceNumberFormat', 'string', true],
            ['recurringInvoiceMonth', 'int', true],
            ['taxPaymentMonth', 'int', true],
            ['serverCostAllocation', 'string', true],
            ['domainPassThrough', 'string', true],
            ['setupCompletedAt', 'datetime'],
            ['createdAt', 'datetime', true],
            ['updatedAt', 'datetime', true],
        ]).execute();

        await columns(db.schema.createTable('users').addColumn('id', 'varchar(36)', (column) => column.primaryKey()), [
            ['tenantId', 'id'],
            ['email', 'string', true],
            ['name', 'string', true],
            ['passwordHash', 'string', true],
            ['role', 'string', true],
            ['locale', 'string', true],
            ['timezone', 'string', true],
            ['theme', 'string', true],
            ['avatarFileId', 'id'],
            ['active', 'bool', true],
            ['lastLoginAt', 'datetime'],
            ['createdAt', 'datetime', true],
            ['updatedAt', 'datetime', true],
        ]).execute();
        await db.schema.createIndex('users_email_uq').on('users').column('email').unique().execute();
        await db.schema.createIndex('users_tenant_idx').on('users').column('tenantId').execute();

        await columns(db.schema.createTable('sessions').addColumn('id', 'varchar(64)', (column) => column.primaryKey()), [
            ['userId', 'id', true],
            ['expiresAt', 'datetime', true],
            ['userAgent', 'string'],
            ['ip', 'string'],
            ['createdAt', 'datetime', true],
        ]).execute();
        await db.schema.createIndex('sessions_user_idx').on('sessions').column('userId').execute();

        await columns(db.schema.createTable('apiTokens').addColumn('id', 'varchar(36)', (column) => column.primaryKey()), [
            ['userId', 'id', true],
            ['tenantId', 'id'],
            ['name', 'string', true],
            ['prefix', 'string', true],
            ['tokenHash', 'string', true],
            ['scope', 'string', true],
            ['expiresAt', 'datetime'],
            ['lastUsedAt', 'datetime'],
            ['createdAt', 'datetime', true],
        ]).execute();
        await db.schema.createIndex('api_tokens_hash_uq').on('apiTokens').column('tokenHash').unique().execute();

        await columns(db.schema.createTable('passwordResets').addColumn('id', 'varchar(64)', (column) => column.primaryKey()), [
            ['userId', 'id', true],
            ['expiresAt', 'datetime', true],
            ['createdAt', 'datetime', true],
        ]).execute();

        await columns(db.schema.createTable('files').addColumn('id', 'varchar(36)', (column) => column.primaryKey()), [
            ['tenantId', 'id'],
            ['sha256', 'string', true],
            ['originalName', 'string', true],
            ['mimeType', 'string', true],
            ['size', 'int', true],
            ['createdBy', 'id'],
            ['createdAt', 'datetime', true],
        ]).execute();
        await db.schema.createIndex('files_tenant_idx').on('files').column('tenantId').execute();

        await columns(db.schema.createTable('auditLog').addColumn('id', 'varchar(36)', (column) => column.primaryKey()), [
            ['tenantId', 'id'],
            ['userId', 'id'],
            ['action', 'string', true],
            ['entity', 'string', true],
            ['entityId', 'id'],
            ['via', 'string', true],
            ['data', 'text'],
            ['createdAt', 'datetime', true],
        ]).execute();
        await db.schema.createIndex('audit_log_tenant_idx').on('auditLog').columns(['tenantId', 'createdAt']).execute();

        await entityTable(db, 'partners', [
            ['name', 'string', true],
            ['email', 'string'],
            ['billingAddress', 'text'],
            ['notes', 'text'],
        ]);

        await entityTable(db, 'customers', [
            ['name', 'string', true],
            ['channel', 'string', true],
            ['partnerId', 'id'],
            ['status', 'string', true],
            ['language', 'string', true],
            ['contactName', 'string'],
            ['email', 'string'],
            ['phone', 'string'],
            ['billingAddress', 'text'],
            ['vatId', 'string'],
            ['hourlyRate', 'int'],
            ['hostingSummary', 'string'],
            ['notes', 'text'],
            ['archivedAt', 'datetime'],
        ]);

        await entityTable(db, 'resources', [
            ['customerId', 'id', true],
            ['kind', 'string', true],
            ['name', 'string', true],
            ['location', 'string'],
            ['details', 'text'],
            ['externalRef', 'string'],
        ]);

        await entityTable(db, 'offers', [
            ['customerId', 'id', true],
            ['number', 'string', true],
            ['date', 'date', true],
            ['validUntil', 'date'],
            ['amount', 'int', true],
            ['status', 'string', true],
            ['description', 'text'],
            ['fileId', 'id'],
        ]);

        await entityTable(db, 'recurringCharges', [
            ['customerId', 'id', true],
            ['service', 'string', true],
            ['description', 'string'],
            ['amountPerYear', 'int', true],
            ['interval', 'string', true],
            ['nextInvoiceDate', 'date', true],
            ['startsAfterSetup', 'bool'],
        ]);

        await entityTable(db, 'recurringCosts', [
            ['name', 'string', true],
            ['type', 'string', true],
            ['provider', 'string', true],
            ['assignedTo', 'id', true],
            ['costPerYear', 'int', true],
            ['rebilledPerYear', 'int', true],
            ['nextRenewal', 'date'],
            ['autoRenew', 'bool'],
            ['endsAt', 'date'],
        ]);

        await entityTable(db, 'expenses', [
            ['date', 'date', true],
            ['vendor', 'string', true],
            ['item', 'string', true],
            ['category', 'string', true],
            ['assignedTo', 'id', true],
            ['grossAmount', 'int', true],
            ['originalAmount', 'int'],
            ['originalCurrency', 'string'],
            ['status', 'string', true],
            ['receiptFileId', 'id'],
        ]);

        await entityTable(db, 'tasks', [
            ['title', 'string', true],
            ['dueDate', 'date'],
            ['customerId', 'id'],
            ['status', 'string', true],
            ['note', 'text'],
        ]);

        await entityTable(db, 'taxYears', [
            ['year', 'int', true],
            ['marginalRatePercent', 'int'],
            ['profitPerAssessment', 'int'],
        ]);

        await entityTable(db, 'taxAdjustments', [
            ['year', 'int', true],
            ['description', 'string', true],
            ['profitAdjustment', 'int', true],
        ]);

        await entityTable(db, 'invoiceTemplates', [
            ['name', 'string', true],
            ['isDefault', 'bool'],
            ['logoFileId', 'id'],
            ['senderLine', 'string'],
            ['introText', 'text'],
            ['closingText', 'text'],
            ['footerLeft', 'text'],
            ['footerCenter', 'text'],
            ['footerRight', 'text'],
            ['accentColor', 'string'],
            ['paymentTermDays', 'int', true],
        ]);

        await entityTable(db, 'invoices', [
            ['number', 'string'],
            ['customerId', 'id', true],
            ['recipientType', 'string', true],
            ['partnerId', 'id'],
            ['templateId', 'id'],
            ['date', 'date'],
            ['dueDate', 'date'],
            ['serviceDateFrom', 'date'],
            ['serviceDateTo', 'date'],
            ['description', 'string', true],
            ['status', 'string', true],
            ['netAmount', 'int', true],
            ['taxAmount', 'int', true],
            ['grossAmount', 'int', true],
            ['paidAt', 'date'],
            ['language', 'string', true],
            ['notes', 'text'],
            ['reminderLevel', 'int', true],
            ['lastReminderAt', 'datetime'],
            ['cancelsInvoiceId', 'id'],
            ['fileId', 'id'],
            ['snapshot', 'text'],
        ]);

        await columns(db.schema.createTable('invoiceLines').addColumn('id', 'varchar(36)', (column) => column.primaryKey()), [
            ['tenantId', 'id', true],
            ['invoiceId', 'id', true],
            ['customerId', 'id', true],
            ['position', 'int', true],
            ['description', 'string', true],
            ['quantity', 'int', true],
            ['unitPrice', 'int', true],
            ['taxRate', 'int', true],
        ]).execute();
        await db.schema.createIndex('invoice_lines_invoice_idx').on('invoiceLines').column('invoiceId').execute();

        await db.schema.createTable('invoiceSequences')
                .addColumn('tenantId', 'varchar(36)', (column) => column.notNull())
                .addColumn('year', 'integer', (column) => column.notNull())
                .addColumn('value', 'integer', (column) => column.notNull())
                .addPrimaryKeyConstraint('invoice_sequences_pk', ['tenantId', 'year'])
                .execute();
    },
};

export default initial;
