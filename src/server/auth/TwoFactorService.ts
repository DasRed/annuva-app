import {randomBytes} from 'node:crypto';
import QRCode from 'qrcode';
import {z} from 'zod';
import writeAudit from '@/server/audit/writeAudit';
import assertAdmin from '@/server/auth/assertAdmin';
import assertTenant from '@/server/auth/assertTenant';
import type AuthContext from '@/server/auth/AuthContext';
import getConfig from '@/server/config/getConfig';
import getDb from '@/server/db/getDb';
import type UserTable from '@/server/db/table/UserTable';
import ApiError from '@/server/error/ApiError';
import decryptSecret from '@/server/security/decryptSecret';
import encryptSecret from '@/server/security/encryptSecret';
import hashToken from '@/server/security/hashToken';
import verifyPassword from '@/server/security/verifyPassword';
import base32Encode from '@/server/totp/base32Encode';
import verifyTotp from '@/server/totp/verifyTotp';
import UserService from '@/server/user/UserService';
import nowIso from '@/server/util/nowIso';
import parseInput from '@/server/validation/parseInput';

const RECOVERY_CODE_COUNT = 10;

const codeSchema = z.object({code: z.string().trim().min(1).max(32)});
const disableSchema = z.object({code: z.string().trim().min(1).max(32), password: z.string().min(1)});

const normalizeRecoveryCode = (code: string) => code.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Optional two-factor authentication with an authenticator app (TOTP, RFC 6238) plus one-time
 * recovery codes. The secret is stored encrypted; codes can be used only once.
 */
export default class TwoFactorService {
    async status(context: AuthContext): Promise<{ enabled: boolean; recoveryCodesLeft: number }> {
        const user = await new UserService().getRow(context.userId);
        return {enabled: user.totpEnabledAt !== null, recoveryCodesLeft: this.recoveryHashes(user).length};
    }

    /** Starts the setup: a new secret (pending until confirmed with a code) and its QR code. */
    async setup(context: AuthContext): Promise<{ qrCode: string; secret: string; uri: string }> {
        this.assertSession(context);
        const user = await new UserService().getRow(context.userId);
        if (user.totpEnabledAt !== null) {
            throw ApiError.conflict('two_factor_enabled', 'Two-factor authentication is already enabled.');
        }
        const secret = randomBytes(20);
        const db = await getDb();
        await db.updateTable('users').set({totpLastStep: null, totpSecret: encryptSecret(secret), updatedAt: nowIso()}).where('id', '=', user.id).execute();
        const issuer = getConfig().appName;
        const encoded = base32Encode(secret);
        const uri = `otpauth://totp/${encodeURIComponent(`${issuer}:${user.email}`)}?secret=${encoded}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
        return {
            qrCode: await QRCode.toString(uri, {errorCorrectionLevel: 'M', margin: 1, type: 'svg'}),
            secret: encoded.match(/.{1,4}/g)!.join(' '),
            uri,
        };
    }

    /** Confirms the pending secret with a first code and returns the recovery codes (shown once). */
    async enable(context: AuthContext, input: unknown): Promise<{ recoveryCodes: string[] }> {
        this.assertSession(context);
        const {code} = parseInput(codeSchema, input);
        const user = await new UserService().getRow(context.userId);
        if (user.totpEnabledAt !== null) {
            throw ApiError.conflict('two_factor_enabled', 'Two-factor authentication is already enabled.');
        }
        if (user.totpSecret === null) {
            throw ApiError.badRequest('two_factor_not_started', 'Start the setup first.');
        }
        const step = verifyTotp(decryptSecret(user.totpSecret), code, null);
        if (step === null) {
            throw ApiError.badRequest('invalid_code', 'The code is not valid. Check the time on your device and try again.', [{field: 'code', message: 'invalid'}]);
        }
        const recoveryCodes = this.newRecoveryCodes();
        const db = await getDb();
        await db.updateTable('users').set({
            totpEnabledAt:     nowIso(),
            totpLastStep:      step,
            totpRecoveryCodes: JSON.stringify(recoveryCodes.map((value) => hashToken(normalizeRecoveryCode(value)))),
            updatedAt:         nowIso(),
        }).where('id', '=', user.id).execute();
        await writeAudit(context, 'enable_two_factor', 'users', user.id);
        return {recoveryCodes};
    }

    /** Turns two-factor authentication off; needs the password and a current or recovery code. */
    async disable(context: AuthContext, input: unknown): Promise<void> {
        this.assertSession(context);
        const data = parseInput(disableSchema, input);
        const user = await new UserService().getRow(context.userId);
        if (!(await verifyPassword(data.password, user.passwordHash))) {
            throw ApiError.badRequest('wrong_password', 'The password is wrong.', [{field: 'password', message: 'wrong'}]);
        }
        if (user.totpEnabledAt !== null && !(await this.consumeCode(user, data.code))) {
            throw ApiError.badRequest('invalid_code', 'The code is not valid.', [{field: 'code', message: 'invalid'}]);
        }
        await this.clear(user.id);
        await writeAudit(context, 'disable_two_factor', 'users', user.id);
    }

    /** Replaces all recovery codes; needs a current code from the app. */
    async regenerateRecoveryCodes(context: AuthContext, input: unknown): Promise<{ recoveryCodes: string[] }> {
        this.assertSession(context);
        const {code} = parseInput(codeSchema, input);
        const user = await new UserService().getRow(context.userId);
        if (user.totpEnabledAt === null || user.totpSecret === null) {
            throw ApiError.badRequest('two_factor_disabled', 'Two-factor authentication is not enabled.');
        }
        const step = verifyTotp(decryptSecret(user.totpSecret), code, user.totpLastStep);
        if (step === null) {
            throw ApiError.badRequest('invalid_code', 'The code is not valid.', [{field: 'code', message: 'invalid'}]);
        }
        const recoveryCodes = this.newRecoveryCodes();
        const db = await getDb();
        await db.updateTable('users').set({
            totpLastStep:      step,
            totpRecoveryCodes: JSON.stringify(recoveryCodes.map((value) => hashToken(normalizeRecoveryCode(value)))),
            updatedAt:         nowIso(),
        }).where('id', '=', user.id).execute();
        await writeAudit(context, 'regenerate_recovery_codes', 'users', user.id);
        return {recoveryCodes};
    }

    /** Admins can switch it off for a user who lost the device. */
    async reset(context: AuthContext, userId: string): Promise<void> {
        assertAdmin(context);
        const user = await new UserService().getRow(userId);
        if (user.tenantId !== assertTenant(context)) {
            throw ApiError.notFound('User not found.');
        }
        await this.clear(user.id);
        await writeAudit(context, 'reset_two_factor', 'users', user.id);
    }

    /** Second login step: a code from the app or an unused recovery code. */
    async verifyLogin(user: UserTable, code: string): Promise<boolean> {
        return user.totpEnabledAt !== null && this.consumeCode(user, code);
    }

    private assertSession(context: AuthContext): void {
        if (context.via !== 'ui') {
            throw ApiError.forbidden('Two-factor authentication can only be changed in the app, not with an API token.');
        }
    }

    private async clear(userId: string): Promise<void> {
        const db = await getDb();
        await db.updateTable('users')
                .set({totpEnabledAt: null, totpLastStep: null, totpRecoveryCodes: null, totpSecret: null, updatedAt: nowIso()})
                .where('id', '=', userId)
                .execute();
    }

    /** Accepts a TOTP code (once per time step) or a recovery code (once at all). */
    private async consumeCode(user: UserTable, code: string): Promise<boolean> {
        const db = await getDb();
        if (user.totpSecret !== null) {
            const step = verifyTotp(decryptSecret(user.totpSecret), code, user.totpLastStep);
            if (step !== null) {
                await db.updateTable('users').set({totpLastStep: step}).where('id', '=', user.id).execute();
                return true;
            }
        }
        const hash = hashToken(normalizeRecoveryCode(code));
        const remaining = this.recoveryHashes(user);
        if (normalizeRecoveryCode(code).length < 10 || !remaining.includes(hash)) {
            return false;
        }
        await db.updateTable('users').set({totpRecoveryCodes: JSON.stringify(remaining.filter((value) => value !== hash))}).where('id', '=', user.id).execute();
        return true;
    }

    private newRecoveryCodes(): string[] {
        return Array.from({length: RECOVERY_CODE_COUNT}, () => {
            const value = base32Encode(randomBytes(7)).toLowerCase().slice(0, 10);
            return `${value.slice(0, 5)}-${value.slice(5)}`;
        });
    }

    private recoveryHashes(user: UserTable): string[] {
        if (user.totpRecoveryCodes === null) {
            return [];
        }
        try {
            const parsed: unknown = JSON.parse(user.totpRecoveryCodes);
            return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
        }
        catch {
            return [];
        }
    }
}
