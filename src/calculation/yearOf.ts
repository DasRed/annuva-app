export default function yearOf(date: string): number {
    return Number(date.slice(0, 4));
}
