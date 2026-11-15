import {createCipheriv, createHash, randomBytes} from 'node:crypto';
import getAuthSecret from '@/server/security/getAuthSecret';

/**
 * Encrypts a small secret (e.g. a TOTP key) with AES-256-GCM; the key is derived from AUTH_SECRET.
 * Result: base64 of iv | tag | ciphertext.
 */
export default function encryptSecret(plain: Buffer): string {
    const key = createHash('sha256').update(`annuva-secret:${getAuthSecret()}`).digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}
