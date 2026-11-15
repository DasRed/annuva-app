/**
 * Next.js start hook (named export required by Next.js).
 */
export async function register(): Promise<void> {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const {default: bootstrap} = await import('@/server/app/bootstrap');
        await bootstrap();
    }
}
