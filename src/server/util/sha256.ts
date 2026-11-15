import {createHash} from 'node:crypto';

export default function sha256(value: string | Buffer): string {
    return createHash('sha256').update(value).digest('hex');
}
