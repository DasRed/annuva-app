import {scrypt, timingSafeEqual} from 'node:crypto';

export default function verifyPassword(password: string, hash: string): Promise<boolean> {
    const [algorithm, cost, blockSize, parallelization, salt, key] = hash.split('$');
    if (algorithm !== 'scrypt' || key === undefined) {
        return Promise.resolve(false);
    }
    const expected = Buffer.from(key, 'base64');
    const N = Number(cost);
    const r = Number(blockSize);
    return new Promise((resolve) => {
        scrypt(password, Buffer.from(salt, 'base64'), expected.length, {maxmem: 128 * N * r * 2, N, p: Number(parallelization), r}, (error, derived) => {
            resolve(error === null && derived.length === expected.length && timingSafeEqual(derived, expected));
        });
    });
}
