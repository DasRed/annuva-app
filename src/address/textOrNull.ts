/**
 * Trimmed text, or null for anything that is not a non-empty string.
 */
export default function textOrNull(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
}
