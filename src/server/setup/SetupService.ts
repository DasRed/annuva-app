import fs from 'node:fs';
import path from 'node:path';
import {timingSafeEqual} from 'node:crypto';
import {sql} from 'kysely';
import {z} from 'zod';
import type AuthContext from '@/server/auth/AuthContext';
import getConfig from '@/server/config/getConfig';
import getDb from '@/server/db/getDb';
import EntityService from '@/server/entity/EntityService';
import ApiError from '@/server/error/ApiError';
import logger from '@/server/log/logger';
import MailService from '@/server/mail/MailService';
import passwordSchema from '@/server/security/passwordSchema';
import getSetupToken from '@/server/setup/getSetupToken';
import isSetupRequired from '@/server/setup/isSetupRequired';
import TenantService from '@/server/tenant/TenantService';
import type PublicUser from '@/server/user/PublicUser';
import UserService from '@/server/user/UserService';
import nowIso from '@/server/util/nowIso';
import parseInput from '@/server/validation/parseInput';

const completeSchema = z.object({
    admin:    z.object({
        email:    z.email(),
        locale:   z.enum(['de', 'en']).optional(),
        name:     z.string().trim().min(1).max(255),
        password: passwordSchema,
        timezone: z.string().max(64).optional(),
    }),
    settings: z.record(z.string(), z.unknown()),
    template: z.record(z.string(), z.unknown()).nullable().optional(),
    token:    z.string().min(1),
});

/**
 * Backend of the setup wizard: checks the token and the database, then creates the tenant, the
 * first admin and optionally the first invoice template.
 */
export default class SetupService {
    async complete(input: unknown): Promise<PublicUser> {
        await this.assertRequired();
        const data = parseInput(completeSchema, input);
        this.assertToken(data.token);

        const tenant = await new TenantService().create({...data.settings, name: data.settings.name ?? data.settings.companyName ?? data.admin.name});
        const user = await new UserService().insert({...data.admin, role: 'admin', tenantId: tenant.id});
        const context: AuthContext = {locale: user.locale, role: 'admin', scope: 'read_write', tenantId: tenant.id, userId: user.id, via: 'system'};
        if (data.template !== null && data.template !== undefined) {
            await new EntityService('invoiceTemplates').create(context, {isDefault: true, name: 'Standard', ...data.template});
        }
        const db = await getDb();
        await db.updateTable('tenants').set({setupCompletedAt: nowIso()}).where('id', '=', tenant.id).execute();

        const tokenFile = path.join(getConfig().dataDir, '.setup-token');
        if (fs.existsSync(tokenFile)) {
            fs.rmSync(tokenFile);
        }
        logger.info(`Setup completed for ${user.email}`);
        return user;
    }

    async status(): Promise<{ database: { driver: string; error: string | null; ok: boolean }; mailEnabled: boolean; required: boolean }> {
        const config = getConfig();
        let error: string | null = null;
        try {
            const db = await getDb();
            await sql`select 1`.execute(db);
        }
        catch (exception) {
            error = exception instanceof Error ? exception.message : String(exception);
        }
        return {
            database:    {driver: config.database.driver, error, ok: error === null},
            mailEnabled: MailService.isEnabled(),
            required:    error === null ? await isSetupRequired() : true,
        };
    }

    async verifyToken(token: unknown): Promise<void> {
        await this.assertRequired();
        this.assertToken(typeof token === 'string' ? token : '');
    }

    private async assertRequired(): Promise<void> {
        if (!(await isSetupRequired())) {
            throw ApiError.conflict('setup_done', 'The setup has already been completed.');
        }
    }

    private assertToken(token: string): void {
        const expected = Buffer.from(getSetupToken());
        const given = Buffer.from(token.trim());
        if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
            throw new ApiError(403, 'invalid_setup_token', 'The setup token is wrong. You find it in the log output of the application.');
        }
    }
}
