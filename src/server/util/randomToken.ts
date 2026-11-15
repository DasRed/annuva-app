import {randomBytes} from 'node:crypto';

export default function randomToken(bytes = 32): string {
    return randomBytes(bytes).toString('base64url');
}
