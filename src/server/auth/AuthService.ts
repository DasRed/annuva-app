import {z} from 'zod';
import createSession from '@/server/auth/createSession';
import loginRateLimit from '@/server/auth/loginRateLimit';
import getConfig from '@/server/config/getConfig';
import getDb from '@/server/db/getDb';
import type UserTable from '@/server/db/table/UserTable';
import ApiError from '@/server/error/ApiError';
import MailService from '@/server/mail/MailService';
import hashPassword from '@/server/security/hashPassword';
import hashToken from '@/server/security/hashToken';
import verifyPassword from '@/server/security/verifyPassword';
import TenantService from '@/server/tenant/TenantService';
import UserService from '@/server/user/UserService';
import nowIso from '@/server/util/nowIso';
import randomToken from '@/server/util/randomToken';
import parseInput from '@/server/validation/parseInput';

const loginSchema = z.object({email: z.string().trim().min(1), password: z.string().min(1)});
const resetRequestSchema = z.object({email: z.email()});
const resetSchema = z.object({password: z.string().min(10).max(200), token: z.string().min(10)});
const registerSchema = z.object({
    companyName: z.string().trim().min(1).max(255),
    email:       z.email(),
    locale:      z.enum(['de', 'en']).optional(),
    name:        z.string().trim().min(1).max(255),
    password:    z.string().min(10).max(200),
});

const RESET_VALIDITY_MS = 2 * 60 * 60 * 1000;

/**
 * Login, logout, password reset and (in multi-tenant mode) self-registration.
 */
export default class AuthService {
    async login(input: unknown, meta: { ip: string | null; userAgent: string | null }): Promise<{ expiresAt: Date; token: string; user: UserTable }> {
        const data = parseInput(loginSchema, input);
        const email = data.email.toLowerCase();
        const key = `${meta.ip ?? 'unknown'}|${email}`;
        if (loginRateLimit.isBlocked(key)) {
            throw new ApiError(429, 'too_many_attempts', 'Too many failed attempts. Please wait a few minutes.');
        }
        const db = await getDb();
        const user = await db.selectFrom('users').selectAll().where('email', '=', email).executeTakeFirst();
        if (user === undefined || user.active !== 1 || !(await verifyPassword(data.password, user.passwordHash))) {
            loginRateLimit.recordFailure(key);
            throw new ApiError(401, 'invalid_credentials', 'E-mail or password is wrong.');
        }
        loginRateLimit.reset(key);
        const session = await createSession(user.id, meta.userAgent, meta.ip);
        return {...session, user};
    }

    async register(input: unknown, meta: { ip: string | null; userAgent: string | null }): Promise<{ expiresAt: Date; token: string; user: UserTable }> {
        if (getConfig().appMode !== 'multi') {
            throw ApiError.notFound('Registration is not available on this instance.');
        }
        const data = parseInput(registerSchema, input);
        const tenant = await new TenantService().create({companyName: data.companyName, name: data.companyName});
        const created = await new UserService().insert({...data, role: 'admin', tenantId: tenant.id});
        const db = await getDb();
        await db.updateTable('tenants').set({setupCompletedAt: nowIso()}).where('id', '=', tenant.id).execute();
        const session = await createSession(created.id, meta.userAgent, meta.ip);
        return {...session, user: await new UserService().getRow(created.id)};
    }

    async requestPasswordReset(input: unknown, baseUrl: string): Promise<void> {
        const data = parseInput(resetRequestSchema, input);
        if (!MailService.isEnabled()) {
            throw new ApiError(503, 'mail_disabled', 'E-mail is not configured. Ask an administrator to reset your password.');
        }
        const db = await getDb();
        const user = await db.selectFrom('users').selectAll().where('email', '=', data.email.toLowerCase()).where('active', '=', 1).executeTakeFirst();
        if (user === undefined) {
            return;
        }
        const token = randomToken();
        await db.insertInto('passwordResets').values({
            createdAt: nowIso(),
            expiresAt: new Date(Date.now() + RESET_VALIDITY_MS).toISOString(),
            id:        hashToken(token),
            userId:    user.id,
        }).execute();
        const german = user.locale === 'de';
        await new MailService().send({
            subject: german ? 'Passwort zurücksetzen' : 'Reset your password',
            text:    german
                     ? `Hallo ${user.name},\n\nüber diesen Link setzt du dein Passwort zurück (2 Stunden gültig):\n${baseUrl}/password-reset?token=${token}\n\nWenn du das nicht angefordert hast, ignoriere diese E-Mail.`
                     : `Hello ${user.name},\n\nuse this link to reset your password (valid for 2 hours):\n${baseUrl}/password-reset?token=${token}\n\nIf you did not request this, ignore this e-mail.`,
            to:      user.email,
        });
    }

    async resetPassword(input: unknown): Promise<void> {
        const data = parseInput(resetSchema, input);
        const db = await getDb();
        const reset = await db.selectFrom('passwordResets').selectAll().where('id', '=', hashToken(data.token)).where('expiresAt', '>', nowIso()).executeTakeFirst();
        if (reset === undefined) {
            throw ApiError.badRequest('invalid_reset_token', 'The link is invalid or has expired.');
        }
        await db.updateTable('users').set({passwordHash: await hashPassword(data.password), updatedAt: nowIso()}).where('id', '=', reset.userId).execute();
        await db.deleteFrom('passwordResets').where('userId', '=', reset.userId).execute();
        await db.deleteFrom('sessions').where('userId', '=', reset.userId).execute();
    }
}
