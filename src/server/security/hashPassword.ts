import {randomBytes, scrypt} from 'node:crypto';

const KEY_LENGTH = 64;
const COST = 2 ** 15;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

export default function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    return new Promise((resolve, reject) => {
        scrypt(password, salt, KEY_LENGTH, {maxmem: 128 * COST * BLOCK_SIZE * 2, N: COST, p: PARALLELIZATION, r: BLOCK_SIZE}, (error, key) => {
            if (error !== null) {
                reject(error);
                return;
            }
            resolve(`scrypt$${COST}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt.toString('base64')}$${key.toString('base64')}`);
        });
    });
}
