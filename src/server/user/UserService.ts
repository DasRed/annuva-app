import {z} from 'zod';
import locales from '@/i18n/locales';
import writeAudit from '@/server/audit/writeAudit';
import assertAdmin from '@/server/auth/assertAdmin';
import assertTenant from '@/server/auth/assertTenant';
import assertWrite from '@/server/auth/assertWrite';
import type AuthContext from '@/server/auth/AuthContext';
import getConfig from '@/server/config/getConfig';
import getDb from '@/server/db/getDb';
import type UserTable from '@/server/db/table/UserTable';
import ApiError from '@/server/error/ApiError';
import hashPassword from '@/server/security/hashPassword';
import verifyPassword from '@/server/security/verifyPassword';
import type PublicUser from '@/server/user/PublicUser';
import toPublicUser from '@/server/user/toPublicUser';
import newId from '@/server/util/newId';
import nowIso from '@/server/util/nowIso';

const password = z.string().min(10, 'At least 10 characters').max(200);
const locale = z.enum(locales as ['de', 'en']);
const theme = z.enum(['system', 'light', 'dark']);

const createSchema = z.object({
    email:    z.email().max(255),
    locale:   locale.optional(),
    name:     z.string().trim().min(1).max(255),
    password,
    role:     z.enum(['admin', 'user']).default('user'),
    timezone: z.string().max(64).optional(),
}).strict();

const updateSchema = z.object({
    active:   z.boolean().optional(),
    email:    z.email().max(255).optional(),
    name:     z.string().trim().min(1).max(255).optional(),
    password: password.optional(),
    role:     z.enum(['admin', 'user']).optional(),
}).strict();

const profileSchema = z.object({
    avatarFileId: z.uuid().nullable().optional(),
    email:        z.email().max(255).optional(),
    locale:       locale.optional(),
    name:         z.string().trim().min(1).max(255).optional(),
    theme:        theme.optional(),
    timezone:     z.string().max(64).optional(),
}).strict();

const passwordSchema = z.object({currentPassword: z.string(), newPassword: password}).strict();

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
    const result = schema.safeParse(input ?? {});
    if (!result.success) {
        throw ApiError.badRequest('validation_failed', 'The data is invalid.', result.error.issues.map((issue) => ({
            field:   issue.path.join('.'),
            message: issue.message,
        })));
    }
    return result.data;
}

/**
 * User management (tenant admins) and the own profile (every user).
 */
export default class UserService {
    async changePassword(context: AuthContext, input: unknown): Promise<void> {
        assertWrite(context);
        const data = parse(passwordSchema, input);
        const user = await this.getRow(context.userId);
        if (!(await verifyPassword(data.currentPassword, user.passwordHash))) {
            throw ApiError.badRequest('wrong_password', 'The current password is wrong.', [{field: 'currentPassword', message: 'wrong'}]);
        }
        const db = await getDb();
        await db.updateTable('users').set({passwordHash: await hashPassword(data.newPassword), updatedAt: nowIso()}).where('id', '=', user.id).execute();
        await writeAudit(context, 'change_password', 'users', user.id);
    }

    async create(context: AuthContext, input: unknown): Promise<PublicUser> {
        assertWrite(context);
        assertAdmin(context);
        const tenantId = assertTenant(context);
        const data = parse(createSchema, input);
        const user = await this.insert({...data, tenantId});
        await writeAudit(context, 'create', 'users', user.id, {email: data.email, role: data.role});
        return user;
    }

    async getProfile(context: AuthContext): Promise<PublicUser> {
        return toPublicUser(await this.getRow(context.userId));
    }

    async getRow(id: string): Promise<UserTable> {
        const db = await getDb();
        const user = await db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
        if (user === undefined) {
            throw ApiError.notFound('User not found.');
        }
        return user;
    }

    /**
     * Creates a user without permission checks. Used by the setup wizard and the registration.
     */
    async insert(data: { email: string; locale?: string; name: string; password: string; role: string; tenantId: string | null; timezone?: string }): Promise<PublicUser> {
        const db = await getDb();
        const email = data.email.trim().toLowerCase();
        const existing = await db.selectFrom('users').select('id').where('email', '=', email).executeTakeFirst();
        if (existing !== undefined) {
            throw ApiError.conflict('email_taken', 'A user with this e-mail address already exists.', [{field: 'email', message: 'taken'}]);
        }
        const now = nowIso();
        const user: UserTable = {
            active:       1,
            avatarFileId: null,
            createdAt:    now,
            email,
            id:           newId(),
            lastLoginAt:  null,
            locale:       data.locale ?? getConfig().defaultLocale,
            name:         data.name,
            passwordHash: await hashPassword(data.password),
            role:         data.role,
            tenantId:     data.tenantId,
            theme:        'system',
            timezone:     data.timezone ?? getConfig().defaultTimezone,
            updatedAt:    now,
        };
        await db.insertInto('users').values(user).execute();
        return toPublicUser(user);
    }

    async list(context: AuthContext): Promise<PublicUser[]> {
        assertAdmin(context);
        const tenantId = assertTenant(context);
        const db = await getDb();
        const users = await db.selectFrom('users').selectAll().where('tenantId', '=', tenantId).orderBy('name').execute();
        return users.map(toPublicUser);
    }

    async remove(context: AuthContext, id: string): Promise<void> {
        assertWrite(context);
        assertAdmin(context);
        if (id === context.userId) {
            throw ApiError.conflict('cannot_delete_self', 'You cannot delete your own account.');
        }
        const user = await this.getTenantUser(context, id);
        await this.assertAdminRemains(context, user, {active: false});
        const db = await getDb();
        await db.deleteFrom('sessions').where('userId', '=', id).execute();
        await db.deleteFrom('apiTokens').where('userId', '=', id).execute();
        await db.deleteFrom('passwordResets').where('userId', '=', id).execute();
        await db.deleteFrom('users').where('id', '=', id).execute();
        await writeAudit(context, 'delete', 'users', id);
    }

    async update(context: AuthContext, id: string, input: unknown): Promise<PublicUser> {
        assertWrite(context);
        assertAdmin(context);
        const user = await this.getTenantUser(context, id);
        const data = parse(updateSchema, input);
        if (id === context.userId && (data.active === false || data.role === 'user')) {
            throw ApiError.conflict('cannot_demote_self', 'You cannot deactivate or demote yourself.');
        }
        await this.assertAdminRemains(context, user, data);
        const changes: Partial<UserTable> = {updatedAt: nowIso()};
        if (data.active !== undefined) {
            changes.active = data.active ? 1 : 0;
        }
        if (data.email !== undefined) {
            changes.email = await this.assertEmailFree(data.email, id);
        }
        if (data.name !== undefined) {
            changes.name = data.name;
        }
        if (data.role !== undefined) {
            changes.role = data.role;
        }
        if (data.password !== undefined) {
            changes.passwordHash = await hashPassword(data.password);
        }
        const db = await getDb();
        await db.updateTable('users').set(changes).where('id', '=', id).execute();
        if (data.active === false || data.password !== undefined) {
            await db.deleteFrom('sessions').where('userId', '=', id).execute();
        }
        await writeAudit(context, 'update', 'users', id, {...data, password: data.password === undefined ? undefined : '***'});
        return toPublicUser(await this.getRow(id));
    }

    async updateProfile(context: AuthContext, input: unknown): Promise<PublicUser> {
        assertWrite(context);
        const data = parse(profileSchema, input);
        const changes: Partial<UserTable> = {...data, updatedAt: nowIso()};
        if (data.email !== undefined) {
            changes.email = await this.assertEmailFree(data.email, context.userId);
        }
        const db = await getDb();
        if (data.avatarFileId !== undefined && data.avatarFileId !== null) {
            const file = await db.selectFrom('files').select(['id', 'mimeType']).where('id', '=', data.avatarFileId).where('createdBy', '=', context.userId).executeTakeFirst();
            if (file === undefined || !file.mimeType.startsWith('image/')) {
                throw ApiError.badRequest('invalid_avatar', 'The avatar must be an image you uploaded.', [{field: 'avatarFileId', message: 'invalid'}]);
            }
        }
        await db.updateTable('users').set(changes).where('id', '=', context.userId).execute();
        return this.getProfile(context);
    }

    private async assertAdminRemains(context: AuthContext, user: UserTable, change: { active?: boolean; role?: string }): Promise<void> {
        const losesAdmin = user.role === 'admin' && (change.role === 'user' || change.active === false);
        if (!losesAdmin) {
            return;
        }
        const db = await getDb();
        const admins = await db.selectFrom('users')
                               .select('id')
                               .where('tenantId', '=', user.tenantId)
                               .where('role', '=', 'admin')
                               .where('active', '=', 1)
                               .where('id', '!=', user.id)
                               .execute();
        if (admins.length === 0) {
            throw ApiError.conflict('last_admin', 'At least one active administrator must remain.');
        }
    }

    private async assertEmailFree(email: string, id: string): Promise<string> {
        const normalized = email.trim().toLowerCase();
        const db = await getDb();
        const existing = await db.selectFrom('users').select('id').where('email', '=', normalized).where('id', '!=', id).executeTakeFirst();
        if (existing !== undefined) {
            throw ApiError.conflict('email_taken', 'A user with this e-mail address already exists.', [{field: 'email', message: 'taken'}]);
        }
        return normalized;
    }

    private async getTenantUser(context: AuthContext, id: string): Promise<UserTable> {
        const user = await this.getRow(id);
        if (user.tenantId !== assertTenant(context)) {
            throw ApiError.notFound('User not found.');
        }
        return user;
    }
}
