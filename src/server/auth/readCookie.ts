export default function readCookie(header: string | null, name: string): string | undefined {
    for (const part of (header ?? '').split(';')) {
        const [key, ...value] = part.trim().split('=');
        if (key === name) {
            return decodeURIComponent(value.join('='));
        }
    }
    return undefined;
}
