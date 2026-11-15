/**
 * SVG path of a bar with 4px rounded data end and a square end at the baseline.
 * `direction` is the side of the data end: up/down (vertical bars) or right/left (horizontal bars).
 */
export default function barPath(x: number, y: number, width: number, height: number, direction: 'down' | 'left' | 'right' | 'up'): string {
    if (width <= 0 || height <= 0) {
        return '';
    }
    if (direction === 'right') {
        const r = Math.min(4, height / 2, width);
        return `M${x},${y}h${width - r}a${r},${r} 0 0 1 ${r},${r}v${height - 2 * r}a${r},${r} 0 0 1 ${-r},${r}h${-(width - r)}z`;
    }
    if (direction === 'left') {
        const r = Math.min(4, height / 2, width);
        return `M${x + width},${y}h${-(width - r)}a${r},${r} 0 0 0 ${-r},${r}v${height - 2 * r}a${r},${r} 0 0 0 ${r},${r}h${width - r}z`;
    }
    const r = Math.min(4, width / 2, height);
    if (direction === 'up') {
        return `M${x},${y + height}v${-(height - r)}a${r},${r} 0 0 1 ${r},${-r}h${width - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${height - r}z`;
    }
    return `M${x},${y}v${height - r}a${r},${r} 0 0 0 ${r},${r}h${width - 2 * r}a${r},${r} 0 0 0 ${r},${-r}v${-(height - r)}z`;
}
