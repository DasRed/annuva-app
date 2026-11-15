import {createHmac, timingSafeEqual} from 'node:crypto';
import getAuthSecret from '@/server/security/getAuthSecret';

const VALIDITY_MS = 5 * 60 * 1000;

const sign = (payload: string) => createHmac('sha256', getAuthSecret()).update(`2fa:${payload}`).digest('base64url');

/**
 * Short-lived, signed proof that the password was correct, exchanged for a session once the second
 * factor is verified. Stateless: user id and expiry are signed with AUTH_SECRET.
 */
const twoFactorChallenge = {
    create(userId: string, now = Date.now()): string {
        const payload = `${userId}.${now + VALIDITY_MS}`;
        return `${payload}.${sign(payload)}`;
    },

    /** The user id, or null when the challenge is invalid or expired. */
    verify(challenge: string, now = Date.now()): string | null {
        const parts = challenge.split('.');
        if (parts.length !== 3) {
            return null;
        }
        const [userId, expires, signature] = parts;
        const expected = Buffer.from(sign(`${userId}.${expires}`));
        const given = Buffer.from(signature);
        if (expected.length !== given.length || !timingSafeEqual(expected, given) || Number(expires) < now) {
            return null;
        }
        return userId;
    },
};

export default twoFactorChallenge;
