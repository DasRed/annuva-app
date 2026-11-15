const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes RFC 4648 base32; spaces, dashes, padding and lower case are tolerated.
 */
export default function base32Decode(input: string): Buffer {
    const clean = input.toUpperCase().replace(/[\s=-]/g, '');
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];
    for (const char of clean) {
        const index = ALPHABET.indexOf(char);
        if (index === -1) {
            throw new Error('Invalid base32 character');
        }
        value = (value << 5) | index;
        bits += 5;
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }
    return Buffer.from(bytes);
}
