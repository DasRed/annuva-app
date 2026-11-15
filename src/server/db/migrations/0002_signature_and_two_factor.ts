import type {Kysely} from 'kysely';
import type {Migration} from 'kysely/migration';

/**
 * Signature on invoice templates and optional two-factor authentication (TOTP) for users.
 */
const signatureAndTwoFactor: Migration = {
    async up(db: Kysely<unknown>): Promise<void> {
        await db.schema.alterTable('invoiceTemplates').addColumn('signatureFileId', 'varchar(36)').execute();
        await db.schema.alterTable('invoiceTemplates').addColumn('signatureName', 'varchar(255)').execute();
        // Encrypted TOTP secret; pending until totpEnabledAt is set.
        await db.schema.alterTable('users').addColumn('totpSecret', 'text').execute();
        await db.schema.alterTable('users').addColumn('totpEnabledAt', 'varchar(32)').execute();
        // Last accepted time step – a code can be used only once.
        await db.schema.alterTable('users').addColumn('totpLastStep', 'integer').execute();
        // JSON array of hashed one-time recovery codes.
        await db.schema.alterTable('users').addColumn('totpRecoveryCodes', 'text').execute();
    },

    async down(db: Kysely<unknown>): Promise<void> {
        for (const column of ['totpRecoveryCodes', 'totpLastStep', 'totpEnabledAt', 'totpSecret']) {
            await db.schema.alterTable('users').dropColumn(column).execute();
        }
        await db.schema.alterTable('invoiceTemplates').dropColumn('signatureName').execute();
        await db.schema.alterTable('invoiceTemplates').dropColumn('signatureFileId').execute();
    },
};

export default signatureAndTwoFactor;
