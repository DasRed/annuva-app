export default function clientMeta(request: Request): { ip: string | null; userAgent: string | null } {
    return {
        ip:        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
    };
}
