import {createHmac} from 'node:crypto';
import getAuthSecret from '@/server/security/getAuthSecret';

/**
 * Hashes session, reset and API tokens before they are stored. Only the hash is persisted.
 */
export default function hashToken(token: string): string {
    return createHmac('sha256', getAuthSecret()).update(token).digest('hex');
}
