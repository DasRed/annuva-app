import {randomUUID} from 'node:crypto';

export default function newId(): string {
    return randomUUID();
}
