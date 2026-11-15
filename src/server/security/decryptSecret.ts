import {createDecipheriv, createHash} from 'node:crypto';
import getAuthSecret from '@/server/security/getAuthSecret';

/**
 * Counterpart of encryptSecret. Throws when the data was tampered with or AUTH_SECRET changed.
 */
export default function decryptSecret(encoded: string): Buffer {
    const key = createHash('sha256').update(`annuva-secret:${getAuthSecret()}`).digest();
    const data = Buffer.from(encoded, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]);
}
