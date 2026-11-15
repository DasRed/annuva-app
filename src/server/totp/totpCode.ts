import {createHmac} from 'node:crypto';

/**
 * HOTP value (RFC 4226) for a time step – the TOTP code (RFC 6238, HMAC-SHA1).
 */
export default function totpCode(secret: Buffer, step: number, digits = 6): string {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(step));
    const hmac = createHmac('sha1', secret).update(counter).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
    return String(binary % 10 ** digits).padStart(digits, '0');
}
