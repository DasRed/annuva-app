import {timingSafeEqual} from 'node:crypto';
import totpCode from '@/server/totp/totpCode';
import totpStep from '@/server/totp/totpStep';

/**
 * Checks a TOTP code against the current time step ± one step (clock drift). Returns the matched
 * step, or null. Steps up to `lastStep` are rejected, so every code works only once.
 */
export default function verifyTotp(secret: Buffer, code: string, lastStep: number | null, timeMs = Date.now()): number | null {
    const normalized = code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(normalized)) {
        return null;
    }
    const current = totpStep(timeMs);
    for (const step of [current - 1, current, current + 1]) {
        if (lastStep !== null && step <= lastStep) {
            continue;
        }
        if (timingSafeEqual(Buffer.from(totpCode(secret, step)), Buffer.from(normalized))) {
            return step;
        }
    }
    return null;
}
