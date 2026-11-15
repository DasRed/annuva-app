/**
 * Rounds an axis maximum up to 1, 2, 2.5 or 5 × 10^n so gridlines land on readable values.
 */
export default function niceMax(value: number): number {
    if (value <= 0) {
        return 1;
    }
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;
    const step = [1, 2, 2.5, 5, 10].find((candidate) => normalized <= candidate) ?? 10;
    return step * magnitude;
}
