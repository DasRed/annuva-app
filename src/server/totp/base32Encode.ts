const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * RFC 4648 base32 without padding – the format authenticator apps expect for secrets.
 */
export default function base32Encode(bytes: Uint8Array): string {
    let bits = 0;
    let value = 0;
    let output = '';
    for (const byte of bytes) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            output += ALPHABET[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += ALPHABET[(value << (5 - bits)) & 31];
    }
    return output;
}
